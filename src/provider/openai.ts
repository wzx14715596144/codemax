import { BaseProvider } from './base';
import type { AIProvider, Message, ChatOptions, Chunk, ModelInfo } from './interface';

interface OpenAIProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export class OpenAIProvider extends BaseProvider implements AIProvider {
  readonly name: string = 'openai';
  protected config: OpenAIProviderConfig;

  constructor(config: OpenAIProviderConfig) {
    super();
    if (!config.apiKey) {
      throw new Error('OpenAI API key is required');
    }
    this.config = {
      ...config,
      baseUrl: (config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, ''),
    };
  }

  async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<Chunk> {
    const body: Record<string, unknown> = {
      model: this.getModel(options),
      messages: messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content.map((c) => c.text || '').join(''),
      })),
      stream: options.stream ?? true,
    };

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map((t) => ({
        type: 'function',
        function: { name: t.name, description: t.description, parameters: t.inputSchema },
      }));
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        yield { type: 'error', error: `OpenAI API error (${response.status}): ${errBody}` };
        return;
      }

      if (options.stream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        const partialToolCalls = new Map<number, { id: string; name: string; args: string }>();

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6).trim();
              if (data === '[DONE]') {
                for (const tc of partialToolCalls.values()) {
                  yield {
                    type: 'tool_use',
                    toolCall: {
                      id: tc.id,
                      type: 'function',
                      function: { name: tc.name, arguments: tc.args },
                    },
                  };
                }
                yield { type: 'done' };
                return;
              }
              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;
                if (delta?.content) {
                  options.onToken?.(delta.content);
                  yield { type: 'text', text: delta.content };
                }
                if (delta?.tool_calls) {
                  for (const tc of delta.tool_calls) {
                    const idx = tc.index ?? 0;
                    if (!partialToolCalls.has(idx)) {
                      partialToolCalls.set(idx, { id: tc.id || '', name: tc.function?.name || '', args: '' });
                    }
                    const entry = partialToolCalls.get(idx)!;
                    if (tc.id) entry.id = tc.id;
                    if (tc.function?.name) entry.name = tc.function.name;
                    if (tc.function?.arguments) entry.args += tc.function.arguments;
                  }
                }
              } catch {
                // skip parse errors
              }
            }
          }
        }
        for (const tc of partialToolCalls.values()) {
          yield {
            type: 'tool_use',
            toolCall: {
              id: tc.id,
              type: 'function',
              function: { name: tc.name, arguments: tc.args },
            },
          };
        }
        yield { type: 'done' };
      } else {
        const parsed = await response.json() as {
          choices?: Array<{ message?: { content?: string } }>;
          usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
        };
        const content = parsed.choices?.[0]?.message?.content || '';
        yield { type: 'text', text: content };
        yield {
          type: 'done',
          usage: parsed.usage ? {
            promptTokens: parsed.usage.prompt_tokens,
            completionTokens: parsed.usage.completion_tokens,
            totalTokens: parsed.usage.total_tokens,
          } : undefined,
        };
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
      { id: 'gpt-4o', name: 'GPT-4o', provider: 'openai', contextLength: 128000 },
      { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'openai', contextLength: 128000 },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', provider: 'openai', contextLength: 128000 },
      { id: 'o3-mini', name: 'o3 Mini', provider: 'openai', contextLength: 200000 },
    ];
  }
}
