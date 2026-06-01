import { BaseProvider } from './base';
import type { AIProvider, Message, ChatOptions, Chunk, ModelInfo } from './interface';

interface OllamaProviderConfig {
  baseUrl?: string;
}

export class OllamaProvider extends BaseProvider implements AIProvider {
  readonly name: string = 'ollama';
  private baseUrl: string;

  constructor(config: OllamaProviderConfig) {
    super();
    this.baseUrl = (config.baseUrl || 'http://localhost:11434').replace(/\/+$/, '');
  }

  async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<Chunk> {
    const body: Record<string, unknown> = {
      model: this.getModel(options),
      messages: messages.map((m) => ({
        role: m.role,
        content: typeof m.content === 'string' ? m.content : m.content.map((c) => c.text || '').join(''),
      })),
      stream: options.stream ?? true,
      options: {
        temperature: options.temperature ?? 0.7,
      },
    };

    try {
      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: options.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        yield { type: 'error', error: `Ollama API error (${response.status}): ${errBody}` };
        return;
      }

      if (options.stream && response.body) {
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
            if (!line.trim()) continue;
            try {
              const parsed = JSON.parse(line);
              if (parsed.message?.content) {
                options.onToken?.(parsed.message.content);
                yield { type: 'text', text: parsed.message.content };
              }
              if (parsed.done) {
                yield {
                  type: 'done',
                  usage: {
                    promptTokens: parsed.prompt_eval_count || 0,
                    completionTokens: parsed.eval_count || 0,
                    totalTokens: (parsed.prompt_eval_count || 0) + (parsed.eval_count || 0),
                  },
                };
              }
            } catch {
              // skip parse errors
            }
          }
        }
      } else {
        const parsed = await response.json() as { message?: { content?: string } };
        const content = parsed.message?.content || '';
        yield { type: 'text', text: content };
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
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json() as { models?: Array<{ name: string }> };
      if (data.models) {
        return data.models.map((m) => ({
          id: m.name,
          name: m.name,
          provider: 'ollama',
          contextLength: 8192,
        }));
      }
    } catch {
      // fall through
    }
    return [
      { id: 'llama3.2', name: 'Llama 3.2', provider: 'ollama', contextLength: 128000 },
      { id: 'llama4-scout', name: 'Llama 4 Scout', provider: 'ollama', contextLength: 128000 },
      { id: 'qwen2.5-coder', name: 'Qwen 2.5 Coder', provider: 'ollama', contextLength: 32768 },
      { id: 'deepseek-coder-v2', name: 'DeepSeek Coder V2', provider: 'ollama', contextLength: 128000 },
    ];
  }
}
