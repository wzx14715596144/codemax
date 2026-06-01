import type { Command } from './registry';
import { logger, getModelId } from '../utils';
import { execSync } from 'child_process';

export const reviewCommand: Command = {
  name: 'review',
  aliases: ['code-review'],
  description: 'Review current diff for correctness and cleanup',
  async execute(_ctx) {
    let diff: string;
    try {
      diff = execSync('git diff', { encoding: 'utf-8', timeout: 5000 });
      if (!diff) {
        logger.info('No uncommitted changes to review');
        return;
      }
    } catch {
      logger.error('Not a git repository');
      return;
    }

    logger.info('── Code Review ──');
    logger.dim('Analyzing changes...');
    logger.info('');

    const provider = _ctx.providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured');
      return;
    }

    const reviewPrompt = `Review the following code diff for correctness issues, bugs, and opportunities for simplification. Be concise and specific.

\`\`\`diff
${diff.slice(0, 8000)}
\`\`\``;

    const msg = { role: 'user' as const, content: reviewPrompt };
    const msgs = [msg];

    try {
      const stream = provider.chat(msgs, {
        model: getModelId(_ctx.config.model),
        stream: true,
        onToken: (token: string) => {
          process.stdout.write(token);
        },
      });

      for await (const chunk of stream) {
        if (chunk.type === 'error') {
          logger.error(chunk.error || 'Unknown error');
        }
      }

      process.stdout.write('\n');
    } catch (err) {
      logger.error('Review failed:', err instanceof Error ? err.message : String(err));
    }
  },
};
