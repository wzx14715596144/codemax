import type { Command } from './registry';
import { logger, getModelId } from '../utils';

export const planCommand: Command = {
  name: 'plan',
  aliases: [],
  description: 'Enter plan mode — outline changes before executing',
  async execute(_ctx) {
    const args = _ctx.input.slice('/plan'.length).trim();
    const description = args || 'Plan the approach before making changes';

    logger.info('── Plan Mode ──');
    logger.info(description);
    logger.info('');
    logger.dim('Planning mode active. Describe what you want to do and I will outline');
    logger.dim('the approach before making any changes.');
    logger.info('');

    const msg = `[PLAN MODE] ${description}. First, outline the plan. Do NOT make any changes yet. Only proceed to implementation after I confirm the plan.`;
    _ctx.session.addMessage({ role: 'user', content: msg });

    const provider = _ctx.providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured');
      return;
    }

    try {
      let responseText = '';
      const stream = provider.chat(_ctx.session.getMessages(), {
        model: getModelId(_ctx.config.model),
        stream: true,
        onToken: (token: string) => {
          process.stdout.write(token);
          responseText += token;
        },
      });

      for await (const chunk of stream) {
        if (chunk.type === 'error') {
          logger.error(chunk.error || 'Unknown error');
        }
      }

      process.stdout.write('\n');
      _ctx.session.addMessage({ role: 'assistant', content: responseText });
    } catch (err) {
      logger.error('Error:', err instanceof Error ? err.message : String(err));
    }
  },
};
