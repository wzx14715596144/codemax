import type { Tool } from './types';
import * as fs from 'fs';

export const readTool: Tool = {
  definition: {
    name: 'read',
    description: 'Read the contents of a file',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path to the file to read',
        },
        offset: {
          type: 'number',
          description: 'Line number to start reading from (1-indexed)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of lines to read',
        },
      },
      required: ['filePath'],
    },
  },
  async execute(args) {
    try {
      const filePath = args.filePath as string;
      const offset = (args.offset as number) || 0;
      const limit = args.limit as number | undefined;

      if (!fs.existsSync(filePath)) {
        return { success: false, output: '', error: `File not found: ${filePath}` };
      }

      const stat = fs.statSync(filePath);
      if (stat.size > 1024 * 1024) {
        return { success: false, output: '', error: 'File too large (>1MB)' };
      }

      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      let result: string;
      if (offset > 0 || limit !== undefined) {
        const start = offset > 0 ? offset - 1 : 0;
        const end = limit !== undefined ? start + limit : lines.length;
        const sliced = lines.slice(start, end);
        result = sliced.map((line, i) => `${start + i + 1}: ${line}`).join('\n');
      } else {
        result = content;
      }

      return { success: true, output: result };
    } catch (err) {
      return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
    }
  },
};
