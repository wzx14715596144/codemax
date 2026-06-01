import type { Command } from './registry';
import { logger } from '../utils';

export const hooksCommand: Command = {
  name: 'hooks',
  description: 'View hook configurations',
  execute(_ctx) {
    const hooks = _ctx.config.hooks || { preTool: [], postTool: [] };

    logger.info('── Hook Configurations ──');
    logger.info('');

    logger.info(`Pre-tool hooks (${hooks.preTool.length}):`);
    for (const h of hooks.preTool) {
      logger.info(`  Match: ${h.match} → ${h.script}`);
    }

    logger.info('');
    logger.info(`Post-tool hooks (${hooks.postTool.length}):`);
    for (const h of hooks.postTool) {
      logger.info(`  Match: ${h.match} → ${h.script}`);
    }
  },
};
