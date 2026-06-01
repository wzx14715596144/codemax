import type { Command } from './registry';
import { logger } from '../utils';

export const modelCommand: Command = {
  name: 'model',
  description: 'Switch the AI model',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const providers = _ctx.providerManager.listProviders();
    if (providers.length === 0) {
      logger.error('No AI providers configured');
      return;
    }

    const currentModel = _ctx.providerManager.getCurrentModel();
    const choices: Array<{ name: string; value: string }> = [];

    for (const p of providers) {
      const provider = _ctx.providerManager.getProvider(p);
      if (provider) {
        const models = await provider.models();
        for (const m of models) {
          const fullId = `${p}/${m.id}`;
          choices.push({
            name: `${fullId} (${m.contextLength.toLocaleString()} ctx)`,
            value: fullId,
          });
        }
      }
    }

    const { model } = await inquirer.prompt([{
      type: 'list',
      name: 'model',
      message: 'Select model:',
      choices,
      default: currentModel,
    }]);

    _ctx.providerManager.setCurrentModel(model);
    logger.success(`Switched to ${model}`);
  },
};
