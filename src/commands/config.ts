import type { Command } from './registry';
import { logger } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

export const configCommand: Command = {
  name: 'config',
  aliases: ['settings'],
  description: 'Open configuration settings',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Configuration settings:',
      choices: [
        { name: 'Show current config', value: 'show' },
        { name: 'Set API key', value: 'api-key' },
        { name: 'Set default model', value: 'model' },
        { name: 'Set permission mode', value: 'permissions' },
        { name: 'Initialize codemax.json', value: 'init' },
      ],
    }]);

    switch (action) {
      case 'show':
        logger.info('Current configuration:');
        console.log(JSON.stringify(_ctx.config, null, 2));
        break;

      case 'api-key': {
        const { provider, key } = await inquirer.prompt([
          {
            type: 'list',
            name: 'provider',
            message: 'Select provider:',
            choices: ['openai', 'anthropic', 'google', 'openrouter', 'azure'],
          },
          { type: 'password', name: 'key', message: 'Enter API key:' },
        ]);
        const configPath = path.join(process.cwd(), 'codemax.json');
        let config: Record<string, unknown> = {};
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        if (!config.providers) config.providers = {};
        (config.providers as Record<string, unknown>)[provider] = { apiKey: key };
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger.success(`Saved API key for ${provider}`);
        break;
      }

      case 'model': {
        const { model } = await inquirer.prompt([{
          type: 'input',
          name: 'model',
          message: 'Enter model ID (e.g., openai/gpt-4o):',
          default: _ctx.config.model,
        }]);
        const configPath = path.join(process.cwd(), 'codemax.json');
        let config: Record<string, unknown> = {};
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        config.model = model;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        _ctx.providerManager.setCurrentModel(model);
        logger.success(`Default model set to ${model}`);
        break;
      }

      case 'permissions': {
        const { mode } = await inquirer.prompt([{
          type: 'list',
          name: 'mode',
          message: 'Default permission mode:',
          choices: [
            { name: 'Ask for each operation (recommended)', value: 'ask' },
            { name: 'Auto-allow all operations', value: 'allow' },
            { name: 'Deny all operations', value: 'deny' },
          ],
        }]);
        const configPath = path.join(process.cwd(), 'codemax.json');
        let config: Record<string, unknown> = {};
        if (fs.existsSync(configPath)) {
          config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        }
        if (!config.permissions) config.permissions = {};
        (config.permissions as Record<string, unknown>).default = mode;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
        logger.success(`Permission mode set to ${mode}`);
        break;
      }

      case 'init': {
        const configPath = path.join(process.cwd(), 'codemax.json');
        if (fs.existsSync(configPath)) {
          logger.warn('codemax.json already exists');
          return;
        }
        const defaultConfig = {
          model: 'openai/gpt-4o',
          providers: {},
          mcpServers: {},
          skills: { enabled: [], customPaths: [] },
          hooks: { preTool: [], postTool: [] },
          permissions: { default: 'ask', allow: [], deny: [] },
        };
        fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2));
        logger.success('Created codemax.json');
        break;
      }
    }
  },
};
