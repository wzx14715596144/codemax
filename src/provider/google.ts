import { BaseProvider } from './base';
import type { AIProvider, Message, ChatOptions, Chunk, ModelInfo } from './interface';

interface GoogleProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export class GoogleProvider extends BaseProvider implements AIProvider {
  readonly name: string = 'google';
  private config: GoogleProviderConfig;

  constructor(config: GoogleProviderConfig) {
    super();
    this.config = {
      ...config,
      baseUrl: (config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta').replace(/\/+$/, ''),
    };
  }

  async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<Chunk> {
    const model = this.getModel(options) || 'gemini-2.0-flash';
    const contents = messages.filter((m) => m.role !== 'system').map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: typeof m.content === 'string' ? m.content : m.content.map((c) => c.text || '').join('') }],
    }));

    const body: Record<string, unknown> = {
      contents,
      generationConfig: {
        temperature: options.temperature ?? 0.7,
        maxOutputTokens: options.maxTokens ?? 8192,
      },
    };

    const systemMsg = messages.find((m) => m.role === 'system');
    if (systemMsg) {
      body.systemInstruction = {
        parts: [{ text: typeof systemMsg.content === 'string' ? systemMsg.content : '' }],
      };
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = [{
        functionDeclarations: options.tools.map((t) => ({
          name: t.name,
          description: t.description,
          parameters: t.inputSchema,
        })),
      }];
    }

    try {
      const url = `${this.config.baseUrl}/models/${model}:streamGenerateContent?alt=sse`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.config.apiKey,
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        yield { type: 'error', error: `Google API error (${response.status}): ${errBody}` };
        return;
      }

      if (response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const parts = parsed.candidates?.[0]?.content?.parts;
                if (parts) {
                  for (const part of parts) {
                    if (part.text) {
                      options.onToken?.(part.text);
                      yield { type: 'text', text: part.text };
                    }
                    if (part.functionCall) {
                      yield {
                        type: 'tool_use',
                        toolCall: {
                          id: part.functionCall.name,
                          type: 'function',
                          function: {
                            name: part.functionCall.name,
                            arguments: JSON.stringify(part.functionCall.args || {}),
                          },
                        },
                      };
                    }
                  }
                }
              } catch {
                // skip parse errors
              }
            }
          }
        }
        yield { type: 'done' };
      }
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        yield { type: 'done' };
        return;
      }
      yield { type: 'error', error: err instanceof Error ? err.message : String(err) };
    }
  }

  async models(): Promise<ModelInfo[]> {
    return [
      { id: 'gemini-2.0-flash', name: 'Gemini 2.0 Flash', provider: 'google', contextLength: 1000000 },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'google', contextLength: 1000000 },
    ];
  }
}
