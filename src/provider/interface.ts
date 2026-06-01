export interface Message {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | ContentBlock[];
  tool_calls?: ToolCall[];
  tool_call_id?: string;
  name?: string;
}

export interface ContentBlock {
  type: 'text' | 'image_url' | 'tool_use' | 'tool_result';
  text?: string;
  image_url?: { url: string };
  id?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string | ContentBlock[];
  is_error?: boolean;
}

export interface ToolCall {
  id: string;
  type: 'function';
  function: {
    name: string;
    arguments: string;
  };
}

export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface ChatOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
  tools?: ToolDefinition[];
  stream?: boolean;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextLength: number;
}

export interface AIProvider {
  readonly name: string;
  chat(messages: Message[], options: ChatOptions): AsyncIterable<Chunk>;
  models(): Promise<ModelInfo[]>;
}

export interface Chunk {
  type: 'text' | 'tool_use' | 'error' | 'done';
  text?: string;
  toolCall?: ToolCall;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}
