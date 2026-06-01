import type { Command } from './registry';
import { logger } from '../utils';
import * as fs from 'fs';
import * as path from 'path';

export const initCommand: Command = {
  name: 'init',
  description: 'Initialize project with a CODEMAX.md guide',
  execute() {
    const filePath = path.join(process.cwd(), 'CODEMAX.md');
    if (fs.existsSync(filePath)) {
      logger.warn('CODEMAX.md already exists');
      return;
    }

    const content = `# CODEMAX Project Guide

## Project Overview

_Edit this file to describe your project. This helps codemax understand your codebase._

## Tech Stack

- _List your technologies here_

## Architecture

- _Describe your architecture here_

## Conventions

- _Describe code conventions here_

## Commands

- Build: \`npm run build\`
- Test: \`npm test\`
- Lint: \`npm run lint\`
- Typecheck: \`npm run typecheck\`
`;

    fs.writeFileSync(filePath, content, 'utf-8');
    logger.success('Created CODEMAX.md — edit it to help codemax understand your project');
  },
};
