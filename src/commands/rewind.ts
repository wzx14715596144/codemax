import type { Command } from './registry';
import { logger } from '../utils';

export const rewindCommand: Command = {
  name: 'rewind',
  description: 'Rewind conversation to a previous checkpoint',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');
    const msgs = _ctx.session.getMessages();

    if (msgs.length <= 1) {
      logger.info('No checkpoints available');
      return;
    }

    const choices = msgs.map((m, i) => ({
      name: `[${i + 1}] ${m.role}: ${typeof m.content === 'string' ? m.content.slice(0, 80) : '(structured)'}`,
      value: i,
    }));

    const { index } = await inquirer.prompt([{
      type: 'list',
      name: 'index',
      message: 'Rewind to which message?',
      choices: choices.reverse().slice(0, 20),
    }]);

    const newMessages = msgs.slice(0, index + 1);
    _ctx.session.clear();
    for (const m of newMessages) {
      _ctx.session.addMessage(m);
    }
    logger.success(`Rewound to message ${index + 1}`);
  },
};
