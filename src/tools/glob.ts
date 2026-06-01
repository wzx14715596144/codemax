import type { Tool } from './types';
import * as fs from 'fs';
import * as path from 'path';

export const globTool: Tool = {
  definition: {
    name: 'glob',
    description: 'Find files matching a glob pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Glob pattern (e.g., "src/**/*.ts")',
        },
        path: {
          type: 'string',
          description: 'Directory to search in (default: current working directory)',
        },
      },
      required: ['pattern'],
    },
  },
  async execute(args) {
    try {
      const pattern = (args.pattern as string).replace(/\\/g, '/');
      const searchPath = (args.path as string) || process.cwd();
      const results: string[] = [];

      function walk(dir: string) {
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          const full = path.join(dir, entry.name).replace(/\\/g, '/');
          if (entry.name === 'node_modules') continue;
          if (entry.isDirectory()) {
            walk(full);
          } else {
            const rel = path.relative(searchPath, full).replace(/\\/g, '/');
            if (matchGlob(rel, pattern)) {
              results.push(rel);
            }
          }
        }
      }

      walk(searchPath);

      if (results.length === 0) {
        return { success: true, output: `No files matching "${pattern}"` };
      }

      const output = results.sort().slice(0, 200).join('\n');
      const truncated = results.length > 200 ? `\n... and ${results.length - 200} more files` : '';
      return { success: true, output: output + truncated };
    } catch (err) {
      return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
    }
  },
};

function matchGlob(filepath: string, pattern: string): boolean {
  let regexStr = '';
  let i = 0;
  while (i < pattern.length) {
    const ch = pattern[i];
    if (ch === '*') {
      if (i + 1 < pattern.length && pattern[i + 1] === '*') {
        if (i + 2 >= pattern.length || pattern[i + 2] === '/' || pattern[i + 2] === '\\') {
          regexStr += '.*';
          i += i + 2 >= pattern.length ? 2 : 3;
        } else {
          regexStr += '[^/]*';
          i++;
        }
      } else {
        regexStr += '[^/]*';
        i++;
      }
    } else if (ch === '?') {
      regexStr += '[^/]';
      i++;
    } else if (ch === '.') {
      regexStr += '\\.';
      i++;
    } else {
      regexStr += ch;
      i++;
    }
  }
  try {
    return new RegExp(`^${regexStr}$`).test(filepath);
  } catch {
    return false;
  }
}
