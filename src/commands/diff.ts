import type { Command } from './registry';
import { logger } from '../utils';
import { execSync } from 'child_process';

export const diffCommand: Command = {
  name: 'diff',
  description: 'Show current uncommitted changes',
  execute() {
    try {
      const diff = execSync('git diff', { encoding: 'utf-8', timeout: 5000 });
      if (!diff) {
        logger.info('No uncommitted changes');
        return;
      }
      logger.info('── Git Diff ──');
      console.log(diff);
    } catch {
      try {
        const status = execSync('git status', { encoding: 'utf-8', timeout: 5000 });
        logger.info('── Git Status ──');
        console.log(status);
      } catch {
        logger.error('Not a git repository or git is not installed');
      }
    }
  },
};
