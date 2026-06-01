import type { Command } from './registry';
import { logger } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

function persistConfig(config: Record<string, unknown>) {
  const configPath = path.join(process.cwd(), 'codemax.json');
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

export const permissionsCommand: Command = {
  name: 'permissions',
  aliases: ['allowed-tools'],
  description: 'Manage tool permission rules',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const perms = _ctx.config.permissions || { default: 'ask', allow: [], deny: [] };

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Permission settings:',
      choices: [
        { name: `View current rules (default: ${perms.default})`, value: 'view' },
        { name: 'Change default permission mode', value: 'mode' },
        { name: 'Add allow rule', value: 'add-allow' },
        { name: 'Add deny rule', value: 'add-deny' },
      ],
    }]);

    switch (action) {
      case 'view':
        logger.info('Permission rules:');
        logger.info(`  Default mode: ${perms.default}`);
        logger.info(`  Allow rules: ${perms.allow?.length || 0}`);
        for (const rule of perms.allow || []) {
          logger.info(`    - ${rule.tool}${rule.pattern ? ` (${rule.pattern})` : ''}`);
        }
        logger.info(`  Deny rules: ${perms.deny?.length || 0}`);
        for (const rule of perms.deny || []) {
          logger.info(`    - ${rule.tool}${rule.pattern ? ` (${rule.pattern})` : ''}`);
        }
        break;

      case 'mode': {
        const { mode } = await inquirer.prompt([{
          type: 'list',
          name: 'mode',
          message: 'Default permission mode:',
          choices: [
            { name: 'Ask for each operation', value: 'ask' },
            { name: 'Auto-allow', value: 'allow' },
            { name: 'Deny all', value: 'deny' },
          ],
          default: perms.default,
        }]);
        persistConfig({
          ...JSON.parse(fs.readFileSync(path.join(process.cwd(), 'codemax.json'), 'utf-8')),
          permissions: { ...perms, default: mode },
        });
        _ctx.config.permissions = { ...perms, default: mode };
        logger.success(`Default permission mode: ${mode}`);
        break;
      }

      case 'add-allow':
      case 'add-deny': {
        const { tool, pattern } = await inquirer.prompt([
          { type: 'input', name: 'tool', message: 'Tool name (e.g., read, write, bash):' },
          { type: 'input', name: 'pattern', message: 'Pattern (optional, e.g., src/**):' },
        ]);
        const rule = { tool, ...(pattern ? { pattern } : {}) };
        const key = action === 'add-allow' ? 'allow' : 'deny';
        const updated = {
          ...JSON.parse(fs.readFileSync(path.join(process.cwd(), 'codemax.json'), 'utf-8')),
          permissions: { ...perms, [key]: [...(perms[key as 'allow' | 'deny'] || []), rule] },
        };
        persistConfig(updated);
        _ctx.config.permissions = updated.permissions;
        logger.success(`Added ${key} rule for tool "${tool}"`);
        break;
      }
    }
  },
};
