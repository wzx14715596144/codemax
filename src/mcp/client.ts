import * as childProcess from 'child_process';
import type { ToolResult } from '../tools/types';
import type { MCPServerConfig } from '../config';

interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export class MCPClient {
  private proc: childProcess.ChildProcess | null = null;
  private config: MCPServerConfig;
  private requestId = 0;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
  private buffer = '';
  private _tools: MCPToolInfo[] = [];
  private connected = false;

  constructor(config: MCPServerConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    if (this.config.type === 'stdio') {
      return this.connectStdio();
    }
    throw new Error(`Unsupported MCP transport: ${this.config.type}`);
  }

  private connectStdio(): Promise<void> {
    return new Promise((resolve, reject) => {
      const proc = childProcess.spawn(this.config.command, this.config.args || [], {
        env: { ...process.env, ...this.config.env },
        stdio: ['pipe', 'pipe', 'pipe'],
      });
      this.proc = proc;

      let initialized = false;

      proc.stdout?.on('data', (data: Buffer) => {
        this.buffer += data.toString();
        this.flushBuffer();
      });

      proc.on('error', (err: Error) => {
        if (!initialized) reject(err);
      });

      proc.on('exit', () => {
        this.connected = false;
        this.proc = null;
      });

      this.sendRequest('initialize', {
        protocolVersion: '2025-06-18',
        capabilities: {},
        clientInfo: { name: 'codemax', version: '0.1.0' },
      }).then(() => {
        initialized = true;
        this.connected = true;
        this.sendNotification('notifications/initialized', {});
        resolve();
      }).catch(reject);
    });
  }

  async listTools(): Promise<MCPToolInfo[]> {
    const result = await this.sendRequest('tools/list', {}) as { tools: MCPToolInfo[] };
    this._tools = result.tools || [];
    return this._tools;
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const result = await this.sendRequest('tools/call', { name, arguments: args }) as {
      content?: Array<{ type: string; text?: string }>;
      isError?: boolean;
    };
    const text = result.content?.filter((c) => c.type === 'text').map((c) => c.text || '').join('\n') || '';
    if (result.isError) {
      return { success: false, output: text, error: text };
    }
    return { success: true, output: text };
  }

  getTools(): MCPToolInfo[] {
    return this._tools;
  }

  isConnected(): boolean {
    return this.connected;
  }

  async disconnect(): Promise<void> {
    if (this.proc) {
      try {
        this.proc.kill();
      } catch {
        // process already exited
      }
      this.proc = null;
    }
    this.connected = false;
  }

  private sendRequest(method: string, params: Record<string, unknown>, timeoutMs = 30000): Promise<unknown> {
    return new Promise((resolve, reject) => {
      this.requestId++;
      const id = String(this.requestId);

      const timer = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error(`MCP request timed out: ${method}`));
      }, timeoutMs);

      this.pending.set(id, {
        resolve: (v: unknown) => { clearTimeout(timer); resolve(v); },
        reject: (e: Error) => { clearTimeout(timer); reject(e); },
      });

      const msg = JSON.stringify({
        jsonrpc: '2.0',
        id: this.requestId,
        method,
        params,
      });

      const p = this.proc;
      if (p?.stdin?.writable) {
        p.stdin.write(msg + '\n');
      } else {
        clearTimeout(timer);
        this.pending.delete(id);
        reject(new Error('MCP server not connected'));
      }
    });
  }

  private sendNotification(method: string, params: Record<string, unknown>) {
    const p = this.proc;
    if (!p?.stdin?.writable) return;
    const msg = JSON.stringify({ jsonrpc: '2.0', method, params });
    p.stdin.write(msg + '\n');
  }

  private flushBuffer() {
    let newlineIdx: number;
    while ((newlineIdx = this.buffer.indexOf('\n')) >= 0) {
      const line = this.buffer.slice(0, newlineIdx).trim();
      this.buffer = this.buffer.slice(newlineIdx + 1);

      if (!line) continue;

      try {
        const msg = JSON.parse(line);
        if (msg.id !== undefined && this.pending.has(String(msg.id))) {
          const pending = this.pending.get(String(msg.id))!;
          this.pending.delete(String(msg.id));
          if (msg.error) {
            pending.reject(new Error(msg.error.message));
          } else {
            pending.resolve(msg.result);
          }
        }
      } catch {
        // Skip malformed JSON lines
      }
    }

    if (this.buffer.length > 1024 * 1024) {
      this.buffer = '';
    }
  }
}
