import type { Command } from './registry';
import { logger, getModelId } from '../utils';
import { execSync } from 'child_process';

export const batchCommand: Command = {
  name: 'batch',
  description: 'Orchestrate large-scale changes across a codebase in parallel',
  async execute(_ctx) {
    const instruction = _ctx.input.slice('/batch'.length).trim();
    if (!instruction) {
      logger.error('Usage: /batch <description of changes>');
      return;
    }

    const provider = _ctx.providerManager.getCurrentProvider();
    if (!provider) {
      logger.error('No AI provider configured');
      return;
    }

    try {
      try {
        execSync('git rev-parse --git-dir', { encoding: 'utf-8', timeout: 3000 });
      } catch {
        logger.warn('Not a git repository. Batch mode requires git.');
        return;
      }

      const planPrompt = `I need to make the following changes across the codebase:

${instruction}

First, analyze the codebase structure and create a plan. Break the work into independent units that can be executed in parallel. For each unit, specify:
1. Which files to modify
2. What changes to make
3. Any dependencies on other units

Output the plan as a numbered list.`;

      logger.info('── Batch Plan ──');
      logger.dim('Analyzing codebase and creating plan...');
      logger.info('');

      const { default: inquirer } = await import('inquirer');

      const stream = provider.chat(
        [{ role: 'user', content: planPrompt }],
        {
          model: getModelId(_ctx.config.model),
          stream: true,
          onToken: (token: string) => process.stdout.write(token),
        },
      );

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      for await (const _chunk of stream) {
        // plan is streamed via onToken
      }

      process.stdout.write('\n\n');

      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Execute this plan?',
        default: false,
      }]);

      if (!confirm) {
        logger.info('Batch cancelled');
        return;
      }

      logger.info('Batch mode: executing changes sequentially...');
      _ctx.session.addMessage({
        role: 'user',
        content: `Execute the following batch changes: ${instruction}. Implement them step by step.`,
      });

      const execStream = provider.chat(_ctx.session.getMessages(), {
        model: getModelId(_ctx.config.model),
        stream: true,
        onToken: (token: string) => process.stdout.write(token),
      });

      let result = '';
      for await (const chunk of execStream) {
        if (chunk.type === 'text' && chunk.text) result += chunk.text;
      }

      process.stdout.write('\n');
      _ctx.session.addMessage({ role: 'assistant', content: result });
      logger.success('Batch execution completed');
    } catch (err) {
      logger.error('Batch failed:', err instanceof Error ? err.message : String(err));
    }
  },
};
