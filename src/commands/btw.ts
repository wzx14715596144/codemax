import type { Command } from './registry';
import { logger, getModelId } from '../utils';

export const btwCommand: Command = {
  name: 'btw',
  description: 'Ask a side question without adding to conversation history',
  async execute(_ctx) {
    const question = _ctx.input.slice('/btw'.length).trim();
    if (!question) {
      logger.error('Usage: /btw <your question>');
      return;
    }

    const provider = _ctx.providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured');
      return;
    }

    try {
      const stream = provider.chat(
        [{ role: 'user', content: question }],
        {
          model: getModelId(_ctx.config.model),
          stream: true,
          onToken: (token: string) => {
            process.stdout.write(token);
          },
        },
      );

      for await (const chunk of stream) {
        if (chunk.type === 'error') {
          logger.error(chunk.error || 'Unknown error');
        }
      }

      process.stdout.write('\n');
    } catch (err) {
      logger.error('Error:', err instanceof Error ? err.message : String(err));
    }
  },
};
