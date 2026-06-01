import type { Command } from './registry';
import { logger } from '../utils';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import pkg from '../../package.json';

export const doctorCommand: Command = {
  name: 'doctor',
  description: 'Diagnose installation and configuration',
  async execute(_ctx) {
    logger.info('── Diagnosis Report ──');
    logger.info('');

    const checks: Array<{ label: string; status: 'ok' | 'warn' | 'error'; detail: string }> = [];

    const nodeMajor = Number(process.version.slice(1).split('.')[0]);
    checks.push({
      label: 'Node.js version',
      status: nodeMajor >= 18 ? 'ok' : 'error',
      detail: process.version,
    });

    checks.push({
      label: 'Platform',
      status: 'ok',
      detail: `${os.platform()} ${os.arch()}`,
    });

    const configPaths = [
      'codemax.json',
      '.codemaxrc',
      '.codemaxrc.json',
      path.join(os.homedir(), '.codemax', 'config.json'),
    ];
    const foundConfig = configPaths.find((p) => fs.existsSync(p));
    checks.push({
      label: 'Configuration',
      status: foundConfig ? 'ok' : 'warn',
      detail: foundConfig ? `Found: ${foundConfig}` : 'No config file found',
    });

    const providers = _ctx.providerManager.listProviders();
    checks.push({
      label: 'AI Providers',
      status: providers.length > 0 ? 'ok' : 'warn',
      detail: providers.length > 0 ? providers.join(', ') : 'No providers configured',
    });

    let gitStatus: string;
    try {
      const out = execSync('git --version', { encoding: 'utf-8', timeout: 3000 }).trim();
      gitStatus = out;
    } catch {
      gitStatus = 'not found';
    }
    checks.push({
      label: 'Git',
      status: gitStatus !== 'not found' ? 'ok' : 'warn',
      detail: gitStatus,
    });

    checks.push({
      label: 'codemax version',
      status: 'ok',
      detail: `v${pkg.version}`,
    });

    for (const c of checks) {
      const icon = c.status === 'ok' ? '✓' : c.status === 'warn' ? '!' : '✗';
      logger.info(`  ${icon} ${c.label}: ${c.detail}`);
    }
  },
};
