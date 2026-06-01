import { cosmiconfig } from 'cosmiconfig';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import { ConfigSchema, type Config } from './schema';
import { defaultConfig } from './default';

const explorer = cosmiconfig('codemax', {
  searchPlaces: [
    'codemax.json',
    '.codemaxrc',
    '.codemaxrc.json',
    '.codemax/config.json',
  ],
});

function loadEnvProviders(): Partial<Config['providers']> {
  const providers: Partial<Config['providers']> = {};
  if (process.env.OPENAI_API_KEY) {
    providers.openai = { apiKey: process.env.OPENAI_API_KEY, baseUrl: process.env.OPENAI_BASE_URL };
  }
  if (process.env.ANTHROPIC_API_KEY) {
    providers.anthropic = { apiKey: process.env.ANTHROPIC_API_KEY, baseUrl: process.env.ANTHROPIC_BASE_URL };
  }
  if (process.env.GOOGLE_API_KEY) {
    providers.google = { apiKey: process.env.GOOGLE_API_KEY };
  }
  if (process.env.OPENROUTER_API_KEY) {
    providers.openrouter = { apiKey: process.env.OPENROUTER_API_KEY };
  }
  return providers;
}

export async function loadConfig(customPath?: string): Promise<Config> {
  let projectConfig: Partial<Config> = {};

  if (customPath) {
    const customPathResolved = path.resolve(customPath);
    if (fs.existsSync(customPathResolved)) {
      try {
        projectConfig = JSON.parse(fs.readFileSync(customPathResolved, 'utf-8'));
      } catch (err) {
        console.error(`Warning: Could not parse config file at ${customPath}:`, err instanceof Error ? err.message : String(err));
      }
    } else {
      console.error(`Warning: Config file not found at ${customPath}`);
    }
  } else {
    try {
      const result = await explorer.search();
      if (result && !result.isEmpty) {
        projectConfig = result.config as Partial<Config>;
      }
    } catch {
      // no config found, use defaults
    }
  }

  const envProviders = loadEnvProviders();

  const merged: Config = {
    ...defaultConfig,
    ...projectConfig,
    providers: {
      ...defaultConfig.providers,
      ...projectConfig.providers,
      ...envProviders,
    },
    mcpServers: {
      ...defaultConfig.mcpServers,
      ...projectConfig.mcpServers,
    },
    skills: {
      enabled: [],
      customPaths: [],
      ...projectConfig.skills,
    },
    hooks: {
      preTool: [],
      postTool: [],
      ...projectConfig.hooks,
    },
    permissions: {
      default: 'ask',
      allow: [],
      deny: [],
      ...projectConfig.permissions,
    },
  };

  const parsed = ConfigSchema.safeParse(merged);
  if (!parsed.success) {
    console.error('Warning: Configuration validation errors, using defaults with fallbacks:');
    for (const issue of parsed.error.issues) {
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
  }

  return parsed.data || defaultConfig;
}

export function getConfigDir(): string {
  const configDir = process.env.CODEMAX_CONFIG_DIR || path.join(os.homedir(), '.codemax');
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
  }
  return configDir;
}
