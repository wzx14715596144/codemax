import type { Command } from './registry';
import { logger } from '../utils';

export const feedbackCommand: Command = {
  name: 'feedback',
  aliases: ['bug'],
  description: 'Submit feedback or report a bug',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const { type, message } = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: 'Feedback type:',
        choices: [
          { name: 'Bug report', value: 'bug' },
          { name: 'Feature request', value: 'feature' },
          { name: 'General feedback', value: 'general' },
        ],
      },
      { type: 'input', name: 'message', message: 'Your message:' },
    ]);
    void message;

    logger.success(`Thank you for your ${type} feedback!`);
    logger.dim('Please also report at: https://github.com/your-username/codemax/issues');
  },
};
