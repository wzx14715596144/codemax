import { BaseProvider } from './base';
import type { AIProvider, Message, ChatOptions, Chunk, ModelInfo } from './interface';

interface AnthropicProviderConfig {
  apiKey: string;
  baseUrl?: string;
}

export class AnthropicProvider extends BaseProvider implements AIProvider {
  readonly name: string = 'anthropic';
  private config: AnthropicProviderConfig;

  constructor(config: AnthropicProviderConfig) {
    super();
    this.config = {
      ...config,
      baseUrl: (config.baseUrl || 'https://api.anthropic.com/v1').replace(/\/+$/, ''),
    };
  }

  async *chat(messages: Message[], options: ChatOptions): AsyncGenerator<Chunk> {
    const systemMsg = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const body: Record<string, unknown> = {
      model: this.getModel(options),
      max_tokens: options.maxTokens || 8192,
      messages: nonSystemMessages.map((m) => ({
        role: m.role === 'tool' ? 'user' : m.role === 'assistant' ? 'assistant' : m.role,
        content: m.role === 'tool'
          ? [{ type: 'tool_result', tool_use_id: m.tool_call_id || '', content: typeof m.content === 'string' ? m.content : '' }]
          : typeof m.content === 'string' ? m.content
            : m.content.map((c) => c.text || '').join(''),
      })),
      stream: options.stream ?? true,
    };

    if (systemMsg) {
      body.system = typeof systemMsg.content === 'string' ? systemMsg.content : '';
    }

    if (options.tools && options.tools.length > 0) {
      body.tools = options.tools.map((t) => ({
        name: t.name,
        description: t.description,
        input_schema: t.inputSchema,
      }));
    }

    try {
      const response = await fetch(`${this.config.baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify(body),
        signal: options.signal,
      });

      if (!response.ok) {
        const errBody = await response.text();
        yield { type: 'error', error: `Anthropic API error (${response.status}): ${errBody}` };
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

          for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            if (line.startsWith('data: ')) {
              try {
                const parsed = JSON.parse(line.slice(6));
                const eventType = parsed.type || '';
                if (eventType === 'content_block_delta' && parsed.delta?.text) {
                  options.onToken?.(parsed.delta.text);
                  yield { type: 'text', text: parsed.delta.text };
                } else if (eventType === 'content_block_start' && parsed.content_block?.type === 'tool_use') {
                  yield {
                    type: 'tool_use',
                    toolCall: {
                      id: parsed.content_block.id,
                      type: 'function',
                      function: {
                        name: parsed.content_block.name,
                        arguments: '',
                      },
                    },
                  };
                } else if (eventType === 'message_stop') {
                  yield { type: 'done' };
                }
              } catch {
                // skip parse errors
              }
            }
          }
        }
      } else {
        const parsed = await response.json() as {
          content?: Array<{ type: string; text?: string }>;
          usage?: { input_tokens: number; output_tokens: number };
        };
        const text = parsed.content?.filter((c) => c.type === 'text').map((c) => c.text || '').join('') || '';
        yield { type: 'text', text };
        yield {
          type: 'done',
          usage: parsed.usage ? {
            promptTokens: parsed.usage.input_tokens,
            completionTokens: parsed.usage.output_tokens,
            totalTokens: parsed.usage.input_tokens + parsed.usage.output_tokens,
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
      { id: 'claude-sonnet-4-20250514', name: 'Claude Sonnet 4', provider: 'anthropic', contextLength: 200000 },
      { id: 'claude-opus-4-20250514', name: 'Claude Opus 4', provider: 'anthropic', contextLength: 200000 },
      { id: 'claude-haiku-3-5-20241022', name: 'Claude Haiku 3.5', provider: 'anthropic', contextLength: 200000 },
    ];
  }
}
