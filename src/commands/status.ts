import type { Command } from './registry';
import { logger } from '../utils';
import pkg from '../../package.json';

export const statusCommand: Command = {
  name: 'status',
  description: 'Show version, model, and session info',
  execute(_ctx) {
    const info = _ctx.session.getInfo();
    logger.info(`codemax v${pkg.version}`);
    logger.info('');
    logger.info(`Model:         ${_ctx.providerManager.getCurrentModel()}`);
    logger.info(`Session ID:    ${info.id}`);
    logger.info(`Messages:      ${info.messageCount}`);
    logger.info(`Context size:  ~${_ctx.session.getContextSize()} tokens`);
    logger.info(`Providers:     ${_ctx.providerManager.listProviders().join(', ') || 'none'}`);
    logger.info(`Start time:    ${info.startTime.toLocaleString()}`);
  },
};
