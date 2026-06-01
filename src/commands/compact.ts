import type { Command } from './registry';
import { logger } from '../utils';

export const compactCommand: Command = {
  name: 'compact',
  description: 'Compact conversation context by summarizing',
  execute(_ctx) {
    const args = _ctx.input.slice('/compact'.length).trim();
    const before = _ctx.session.getContextSize();
    _ctx.session.compact(args || undefined);
    const after = _ctx.session.getContextSize();
    logger.success(`Context compacted: ~${before.toLocaleString()} → ~${after.toLocaleString()} tokens`);
  },
};
