import type { Config } from '../config';
import type { SessionManager } from '../session/manager';
import type * as readline from 'readline';
import type { AIProviderManager } from '../provider/manager';
import type { MCPManager } from '../mcp/manager';

export interface CommandContext {
  input: string;
  config: Config;
  session: SessionManager;
  rl: readline.Interface;
  providerManager: AIProviderManager;
  mcpManager?: MCPManager;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  execute(ctx: CommandContext): Promise<void> | void;
}

export class CommandRegistry {
  private commands: Map<string, Command> = new Map();

  register(cmd: Command) {
    this.commands.set(cmd.name, cmd);
    if (cmd.aliases) {
      for (const alias of cmd.aliases) {
        this.commands.set(alias, cmd);
      }
    }
  }

  find(input: string): Command | undefined {
    const trimmed = input.trim();
    const parts = trimmed.split(/\s+/);
    const name = parts[0].slice(1).toLowerCase();
    return this.commands.get(name);
  }

  getAll(): Command[] {
    const seen = new Set<string>();
    const result: Command[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result;
  }

  getNames(): string[] {
    return this.getAll().map((c) => c.name);
  }
}
