import type { Tool } from './types';
import * as fs from 'fs';

export const editTool: Tool = {
  definition: {
    name: 'edit',
    description: 'Edit a file by finding and replacing exact text. Use this for targeted changes.',
    inputSchema: {
      type: 'object',
      properties: {
        filePath: {
          type: 'string',
          description: 'Absolute path to the file to edit',
        },
        oldString: {
          type: 'string',
          description: 'Exact text to find and replace',
        },
        newString: {
          type: 'string',
          description: 'Text to replace with',
        },
        replaceAll: {
          type: 'boolean',
          description: 'Replace all occurrences (default: false, only replaces first)',
        },
      },
      required: ['filePath', 'oldString', 'newString'],
    },
  },
  async execute(args) {
    try {
      const filePath = args.filePath as string;
      const oldString = args.oldString as string;
      const newString = args.newString as string;
      const replaceAll = args.replaceAll as boolean | undefined;

      if (!fs.existsSync(filePath)) {
        return { success: false, output: '', error: `File not found: ${filePath}` };
      }

      const content = fs.readFileSync(filePath, 'utf-8');

      if (!content.includes(oldString)) {
        return { success: false, output: '', error: 'oldString not found in file' };
      }

      const newContent = replaceAll
        ? content.replaceAll(oldString, newString)
        : content.replace(oldString, newString);

      fs.writeFileSync(filePath, newContent, 'utf-8');

      const diffLines = newContent.split('\n').length - content.split('\n').length;
      const sign = diffLines >= 0 ? '+' : '';
      return { success: true, output: `Applied edit. Net line change: ${sign}${diffLines}` };
    } catch (err) {
      return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
    }
  },
};
