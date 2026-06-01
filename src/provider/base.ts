import type { AIProvider, Message, ChatOptions, Chunk, ModelInfo } from './interface';

export abstract class BaseProvider implements AIProvider {
  abstract readonly name: string;

  abstract chat(messages: Message[], options: ChatOptions): AsyncIterable<Chunk>;

  abstract models(): Promise<ModelInfo[]>;

  protected getModel(options: ChatOptions): string {
    return options.model || 'gpt-4o';
  }

  protected async *textChunk(text: string): AsyncGenerator<Chunk> {
    yield { type: 'text', text };
  }

  protected async *errorChunk(error: string): AsyncGenerator<Chunk> {
    yield { type: 'error', error };
  }

  protected async *doneChunk(usage?: { promptTokens: number; completionTokens: number; totalTokens: number }): AsyncGenerator<Chunk> {
    yield { type: 'done', usage };
  }
}
