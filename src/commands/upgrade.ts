import type { Command } from './registry';
import { logger } from '../utils';
import { execSync } from 'child_process';
import pkg from '../../package.json';

export const upgradeCommand: Command = {
  name: 'upgrade',
  description: 'Check for updates',
  execute() {
    logger.info(`Current version: v${pkg.version}`);
    try {
      const result = execSync('npm view codemax version 2>/dev/null', {
        encoding: 'utf-8',
        timeout: 10000,
      }).trim();
      if (result && result !== pkg.version) {
        logger.info(`Latest version: v${result}`);
        logger.info('Run: npm update -g codemax');
      } else {
        logger.success('You are on the latest version');
      }
    } catch {
      logger.info('Could not check for updates. Visit https://github.com/your-username/codemax');
    }
  },
};
