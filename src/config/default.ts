import type { Config } from './schema';

export const defaultConfig: Config = {
  providers: {},
  model: 'openai/gpt-4o',
  mcpServers: {},
  skills: {
    enabled: [],
    customPaths: [],
  },
  hooks: {
    preTool: [],
    postTool: [],
  },
  permissions: {
    default: 'ask',
    allow: [],
    deny: [],
  },
  theme: 'dark',
  editor: 'default',
};
