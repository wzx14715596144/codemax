import type { Config } from '../config';
import { logger } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

export function configAction(action: string, config: Config, key?: string, value?: string) {
  switch (action) {
    case 'show':
      logger.info('Current configuration:');
      console.log(JSON.stringify(config, null, 2));
      break;

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

    case 'set': {
      if (!key || !value) {
        logger.error('Usage: codemax config set <key> <value>');
        return;
      }
      const configPath = path.join(process.cwd(), 'codemax.json');
      let current: Record<string, unknown> = {};
      if (fs.existsSync(configPath)) {
        current = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
      const keys = key.split('.');
      let obj = current;
      for (let i = 0; i < keys.length - 1; i++) {
        if (typeof obj[keys[i]] !== 'object' || obj[keys[i]] === null) {
          obj[keys[i]] = {};
        }
        obj = obj[keys[i]] as Record<string, unknown>;
      }
      obj[keys[keys.length - 1]] = value;
      fs.writeFileSync(configPath, JSON.stringify(current, null, 2));
      logger.success(`Set ${key} = ${value}`);
      break;
    }

    default:
      logger.error(`Unknown config action: ${action}`);
  }
}
