import type { Message } from '../provider/interface';

export interface SessionInfo {
  id: string;
  startTime: Date;
  messageCount: number;
}

export class SessionManager {
  private messages: Message[] = [];
  private sessionId: string = '';
  private startTime: Date = new Date();
  private contextSize: number = 0;

  start() {
    this.sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    this.startTime = new Date();
    this.messages = [];
    this.contextSize = 0;
  }

  addMessage(msg: Message) {
    this.messages.push(msg);
    this.contextSize += this.estimateTokens(msg);
  }

  getMessages(): Message[] {
    return this.messages;
  }

  getInfo(): SessionInfo {
    return {
      id: this.sessionId,
      startTime: this.startTime,
      messageCount: this.messages.length,
    };
  }

  clear() {
    this.messages = [];
    this.contextSize = 0;
  }

  compact(instructions?: string) {
    const systemMessages = this.messages.filter((m) => m.role === 'system');
    const summary = `[Previous conversation summarized. ${instructions || 'Continuing task.'}]`;

    const summaryMsg: Message = {
      role: 'system',
      content: summary,
    };

    this.messages = [...systemMessages, summaryMsg];
    this.contextSize = systemMessages.reduce((acc, m) => acc + this.estimateTokens(m), 0) + this.estimateTokens(summaryMsg);
  }

  getContextSize(): number {
    return this.contextSize;
  }

  private estimateTokens(msg: Message): number {
    const text = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
    return Math.ceil(text.length / 4);
  }
}
