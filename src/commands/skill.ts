import type { Command } from './registry';
import { logger } from '../utils';
import * as fs from 'fs';
import * as path from 'path';
import { loadSkills } from '../skills/loader';

export const skillCommand: Command = {
  name: 'skill',
  description: 'Manage skills',
  async execute(_ctx) {
    const { default: inquirer } = await import('inquirer');

    const { action } = await inquirer.prompt([{
      type: 'list',
      name: 'action',
      message: 'Skill management:',
      choices: [
        { name: 'List available skills', value: 'list' },
        { name: 'Create a new skill', value: 'create' },
      ],
    }]);

    switch (action) {
      case 'list': {
        const cmdRegistry = new (await import('../commands/registry')).CommandRegistry();
        const skills = loadSkills(_ctx.config, cmdRegistry);
        if (skills.length === 0) {
          logger.info('No skills loaded');
          return;
        }
        for (const s of skills) {
          logger.info(`  /${s.name} — ${s.description}`);
        }
        break;
      }

      case 'create': {
        const { name, description } = await inquirer.prompt([
          { type: 'input', name: 'name', message: 'Skill name:' },
          { type: 'input', name: 'description', message: 'Description:' },
        ]);

        const skillsDir = path.join(process.cwd(), '.codemax', 'skills');
        if (!fs.existsSync(skillsDir)) {
          fs.mkdirSync(skillsDir, { recursive: true });
        }

        const filePath = path.join(skillsDir, `${name}.md`);
        if (fs.existsSync(filePath)) {
          logger.warn(`Skill "${name}" already exists`);
          return;
        }

        const content = `# ${name}: ${description}

Your prompt template goes here. Use {input} for user arguments and {cwd} for the working directory.
`;
        fs.writeFileSync(filePath, content, 'utf-8');
        logger.success(`Created skill: ${filePath}`);
        break;
      }
    }
  },
};
