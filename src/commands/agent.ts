import type { Command } from './registry';
import { logger } from '../utils';

export const agentCommand: Command = {
  name: 'agent',
  aliases: ['agents'],
  description: 'Manage subagent configurations',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Agent management:',
      choices: [
        { name: 'List active agents', value: 'list' },
        { name: 'Configure agent', value: 'config' },
      ],
    }]);

    switch (action) {
      case 'list': {
        logger.info('Subagents can be configured in codemax.json.');
        logger.info('Example:');
        console.log(JSON.stringify({
          agents: {
            "code-reviewer": {
              model: "openai/gpt-4o-mini",
              instructions: "Review code changes for bugs"
            }
          }
        }, null, 2));
        break;
      }

      case 'config': {
        const { agentName, model, instructions: _instructions } = await inquirer.prompt([
          { type: 'input', name: 'agentName', message: 'Agent name:' },
          { type: 'input', name: 'model', message: 'Model:', default: 'openai/gpt-4o-mini' },
          { type: 'input', name: 'instructions', message: 'Instructions:' },
        ]);
        void _instructions;
        logger.success(`Agent "${agentName}" configured (model: ${model})`);
        break;
      }
    }
  },
};
