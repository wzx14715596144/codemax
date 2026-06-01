import type { Tool } from './types';
import { execSync } from 'child_process';

export const bashTool: Tool = {
  definition: {
    name: 'bash',
    description: 'Execute a shell command in the project directory',
    inputSchema: {
      type: 'object',
      properties: {
        command: {
          type: 'string',
          description: 'Shell command to execute',
        },
        description: {
          type: 'string',
          description: 'Brief description of what the command does',
        },
        timeout: {
          type: 'number',
          description: 'Timeout in milliseconds (default: 30000)',
        },
      },
      required: ['command'],
    },
  },
  async execute(args) {
    const command = args.command as string;
    const timeout = (args.timeout as number) || 30000;

    if (command.length > 2000) {
      return { success: false, output: '', error: 'Command too long (max 2000 chars)' };
    }

    try {
      const output = execSync(command, {
        encoding: 'utf-8',
        timeout,
        maxBuffer: 1024 * 1024,
        windowsHide: true,
      });
      return {
        success: true,
        output: output || '(command completed with no output)',
      };
    } catch (err) {
      const execErr = err as Error & { stdout?: string; stderr?: string };
      const stderr = execErr.stderr || '';
      const stdout = execErr.stdout || '';
      const message = execErr.message || String(err);
      return {
        success: false,
        output: stdout || message,
        error: stderr || message,
      };
    }
  },
};
