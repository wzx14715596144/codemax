import type { Command } from './registry';

export const exitCommand: Command = {
  name: 'exit',
  aliases: ['quit'],
  description: 'Exit the CLI',
  execute(_ctx) {
    process.stdout.write('\n');
    process.exit(0);
  },
};
