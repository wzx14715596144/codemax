import type { Tool } from './types';
import * as fs from 'fs';
import * as path from 'path';

export const grepTool: Tool = {
  definition: {
    name: 'grep',
    description: 'Search file contents using a regex pattern',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: {
          type: 'string',
          description: 'Regex pattern to search for',
        },
        path: {
          type: 'string',
          description: 'Directory to search in (default: current working directory)',
        },
        include: {
          type: 'string',
          description: 'File extension filter (e.g., "ts" for .ts files). Supports comma-separated values like "ts,tsx"',
        },
      },
      required: ['pattern'],
    },
  },
  async execute(args) {
    try {
      const pattern = args.pattern as string;
      const searchPath = (args.path as string) || process.cwd();
      const include = args.include as string | undefined;
      const regex = new RegExp(pattern, 'gi');
      const results: string[] = [];

      const maxResults = 100;
      const maxFileSize = 1024 * 512;

      const extensions = include
        ? include.split(',').map((e) => (e.startsWith('.') ? e : `.${e}`).toLowerCase())
        : null;

      function walk(dir: string) {
        let entries: fs.Dirent[];
        try {
          entries = fs.readdirSync(dir, { withFileTypes: true });
        } catch {
          return;
        }
        for (const entry of entries) {
          if (results.length >= maxResults) return;
          const full = path.join(dir, entry.name);
          if (entry.name === 'node_modules') continue;
          if (entry.isDirectory()) {
            if (!entry.name.startsWith('.')) {
              walk(full);
            }
          } else if (entry.isFile()) {
            if (extensions && !extensions.some((ext) => entry.name.toLowerCase().endsWith(ext))) {
              continue;
            }
            try {
              const stat = fs.statSync(full);
              if (stat.size > maxFileSize) continue;
              const content = fs.readFileSync(full, 'utf-8');
              const lines = content.split('\n');
              for (let i = 0; i < lines.length; i++) {
                regex.lastIndex = 0;
                if (regex.test(lines[i])) {
                  const rel = path.relative(searchPath, full).replace(/\\/g, '/');
                  results.push(`${rel}:${i + 1}: ${lines[i].trim().slice(0, 150)}`);
                  if (results.length >= maxResults) return;
                }
              }
            } catch {
              // skip unreadable files
            }
          }
        }
      }

      walk(searchPath);

      if (results.length === 0) {
        return { success: true, output: `No matches for "${pattern}"` };
      }

      return { success: true, output: results.join('\n') };
    } catch (err) {
      return { success: false, output: '', error: err instanceof Error ? err.message : String(err) };
    }
  },
};
