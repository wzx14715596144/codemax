import type { Command } from './registry';
import { logger, getModelId } from '../utils';

export const backgroundCommand: Command = {
  name: 'background',
  aliases: ['bg'],
  description: 'Run a prompt in background without blocking conversation',
  async execute(_ctx) {
    const prompt = _ctx.input.slice('/background'.length).trim();
    if (!prompt) {
      logger.error('Usage: /background <prompt>');
      return;
    }

    const provider = _ctx.providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured');
      return;
    }

    logger.dim('Running in background...');
    logger.info('');

    try {
      const stream = provider.chat(
        [{ role: 'user', content: prompt }],
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
      logger.dim('(Background task completed — result not added to conversation history)');
    } catch (err) {
      logger.error('Background task failed:', err instanceof Error ? err.message : String(err));
    }
  },
};
