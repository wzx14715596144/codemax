import type { Tool } from './types';
import * as fs from 'fs';
import * as path from 'path';

export const writeTool: Tool = {
  definition: {
    name: 'write',
    description: 'Write content to a file (creates directories if needed)',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path to the file to write',
        },
        content: {
          type: 'string',
          description: 'Content to write to the file',
        },
      },
      required: ['filePath', 'content'],
    },
  },
  async execute(args) {
    try {
      const filePath = args.filePath as string;
      const content = args.content as string;

      const dir = path.dirname(filePath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      fs.writeFileSync(filePath, content, 'utf-8');
      return { success: true, output: `Written ${Buffer.byteLength(content, 'utf-8')} bytes to ${filePath}` };
    } catch (err) {
      return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
    }
  },
};
