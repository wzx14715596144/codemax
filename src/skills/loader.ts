import type { Config } from '../config';
import type { Command, CommandContext } from '../commands/registry';
import { CommandRegistry } from '../commands/registry';
import * as fs from 'fs';
import * as path from 'path';
import { logger, getModelId } from '../utils';

export interface Skill {
  name: string;
  description: string;
  prompt: string;
  aliases?: string[];
}

function loadSkillFile(filePath: string): Skill | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    let name = path.basename(filePath, path.extname(filePath));
    let description = `Custom skill: ${name}`;
    let prompt = content.trim();

    const firstLine = lines[0]?.trim();
    if (firstLine?.startsWith('# ') && firstLine.includes(':')) {
      const match = firstLine.match(/^#\s+([^:]+):\s*(.+)$/);
      if (match) {
        name = match[1].trim();
        description = match[2].trim();
        prompt = lines.slice(1).join('\n').trim();
      }
    }

    if (!prompt) return null;
    return { name, description, prompt };
  } catch {
    return null;
  }
}

export function loadSkills(config: Config, cmdRegistry: CommandRegistry): Skill[] {
  const skills: Skill[] = [];
  const builtInDir = path.resolve(__dirname, 'built-in');
  const paths = [builtInDir, ...(config.skills?.customPaths || [])];

  for (const dir of paths) {
    if (!fs.existsSync(dir)) continue;
    try {
      const files = fs.readdirSync(dir);
      for (const file of files) {
        if (file.endsWith('.md')) {
          const skill = loadSkillFile(path.join(dir, file));
          if (skill && (!config.skills?.enabled?.length || config.skills.enabled.includes(skill.name) || config.skills.enabled.length === 0)) {
            skills.push(skill);
            registerSkillCommand(skill, cmdRegistry);
          }
        }
      }
    } catch {
      // skip invalid directories
    }
  }

  return skills;
}

function registerSkillCommand(skill: Skill, cmdRegistry: CommandRegistry) {
  const skillCmd: Command = {
    name: skill.name,
    aliases: skill.aliases,
    description: skill.description,
    async execute(ctx: CommandContext) {
      const args = ctx.input.slice(`/${skill.name}`.length).trim();
      const prompt = skill.prompt.replace(/\{input\}/g, args).replace(/\{cwd\}/g, process.cwd());

      ctx.session.addMessage({ role: 'user', content: prompt });

      const provider = ctx.providerManager.getCurrentProvider();
      if (!provider) {
        logger.error('No AI provider configured');
        return;
      }

      try {
        let fullResponse = '';
        const stream = provider.chat(ctx.session.getMessages(), {
          model: getModelId(ctx.config.model),
          stream: true,
          onToken: (token: string) => {
            process.stdout.write(token);
            fullResponse += token;
          },
        });

        for await (const chunk of stream) {
          if (chunk.type === 'text' && chunk.text) {
            fullResponse += chunk.text;
          } else if (chunk.type === 'error') {
            logger.error(chunk.error || 'Unknown error');
          }
        }

        process.stdout.write('\n');
        ctx.session.addMessage({ role: 'assistant', content: fullResponse || '(no response)' });
      } catch (err) {
        logger.error('Error:', err instanceof Error ? err.message : String(err));
      }
    },
  };

  cmdRegistry.register(skillCmd);
}
