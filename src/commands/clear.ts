import type { Command } from './registry';
import { logger } from '../utils';

export const clearCommand: Command = {
  name: 'clear',
  aliases: ['reset', 'new'],
  description: 'Start a new conversation with empty context',
  execute(_ctx) {
    _ctx.session.clear();
    logger.success('Context cleared. Starting fresh conversation.');
  },
};
