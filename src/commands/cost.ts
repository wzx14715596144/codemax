import type { Command } from './registry';
import { logger } from '../utils';

export const costCommand: Command = {
  name: 'cost',
  aliases: ['usage'],
  description: 'Show token usage and cost estimate',
  execute(_ctx) {
    const info = _ctx.session.getInfo();
    const ctxSize = _ctx.session.getContextSize();
    logger.info('── Session Usage ──');
    logger.info('');
    logger.info(`  Messages:        ${info.messageCount}`);
    logger.info(`  Context tokens:  ~${ctxSize.toLocaleString()}`);
    logger.info('');
    logger.dim('Note: Accurate token counting requires provider-specific tokenizers.');
    logger.dim('Install a tokenizer library for precise counts.');
  },
};
