#!/usr/bin/env node

import { Command } from 'commander';
import { loadConfig } from '../config';
import { logger, LogLevel } from '../utils';
import { chatAction } from './chat';
import { configAction } from './config';
import pkg from '../../package.json';

async function main() {
  const program = new Command();

  program
    .name('codemax')
    .description('A powerful CLI AI coding tool with multi-provider support, MCP integration, and skills.')
    .version(pkg.version);

  program
    .option('-c, --config <path>', 'Path to config file')
    .option('--debug', 'Enable debug logging')
    .option('--model <model>', 'Model to use (e.g. openai/gpt-4o)');

  program
    .argument('[prompt]', 'Optional prompt to run in one-shot mode')
    .action(async (prompt?: string) => {
      const opts = program.opts();
      if (opts.debug) {
        logger.setLevel(LogLevel.DEBUG);
      }

      const config = await loadConfig(opts.config);

      if (opts.model) {
        config.model = opts.model;
      }

      if (prompt) {
        const { oneShotAction } = await import('./one-shot');
        await oneShotAction(prompt, config);
      } else {
        await chatAction(config);
      }
    });

  const configCmd = program.command('config')
    .description('Manage configuration');

  configCmd.command('show')
    .description('Show current configuration')
    .action(async () => {
      const opts = program.opts();
      const config = await loadConfig(opts.config);
      configAction('show', config);
    });

  configCmd.command('init')
    .description('Initialize codemax configuration')
    .action(async () => {
      const opts = program.opts();
      const config = await loadConfig(opts.config);
      configAction('init', config);
    });

  configCmd.command('set <key> <value>')
    .description('Set a configuration value')
    .action(async (key: string, value: string) => {
      const opts = program.opts();
      const config = await loadConfig(opts.config);
      configAction('set', config, key, value);
    });

  await program.parseAsync(process.argv);
}

main().catch((err) => {
  logger.error('Fatal error:', err);
  process.exit(1);
});
