import { z } from 'zod';

const providerApiKey = z.string().min(1, 'API key is required');

export const ProviderConfigSchema = z.object({
  openai: z.object({ apiKey: providerApiKey, baseUrl: z.string().optional() }).optional(),
  anthropic: z.object({ apiKey: providerApiKey, baseUrl: z.string().optional() }).optional(),
  google: z.object({ apiKey: providerApiKey, baseUrl: z.string().optional() }).optional(),
  openrouter: z.object({ apiKey: providerApiKey, baseUrl: z.string().optional() }).optional(),
  ollama: z.object({ baseUrl: z.string().default('http://localhost:11434') }).optional(),
  azure: z.object({
    apiKey: providerApiKey,
    endpoint: z.string(),
    deploymentName: z.string(),
  }).optional(),
});

export const MCPServerConfigSchema = z.object({
  command: z.string(),
  args: z.array(z.string()).optional().default([]),
  env: z.record(z.string()).optional().default({}),
  type: z.enum(['stdio', 'sse']).optional().default('stdio'),
  url: z.string().optional(),
});

export const HookConfigSchema = z.object({
  match: z.string(),
  script: z.string(),
  timeout: z.number().optional().default(30000),
});

export const PermissionRuleSchema = z.object({
  tool: z.string(),
  pattern: z.string().optional(),
});

export const ConfigSchema = z.object({
  providers: ProviderConfigSchema.optional().default({}),
  model: z.string().optional().default('openai/gpt-4o'),
  mcpServers: z.record(MCPServerConfigSchema).optional().default({}),
  skills: z.object({
    enabled: z.array(z.string()).optional().default([]),
    customPaths: z.array(z.string()).optional().default([]),
  }).optional(),
  hooks: z.object({
    preTool: z.array(HookConfigSchema).optional().default([]),
    postTool: z.array(HookConfigSchema).optional().default([]),
  }).optional(),
  permissions: z.object({
    default: z.enum(['allow', 'ask', 'deny']).optional().default('ask'),
    allow: z.array(PermissionRuleSchema).optional().default([]),
    deny: z.array(PermissionRuleSchema).optional().default([]),
  }).optional(),
  theme: z.enum(['dark', 'light']).optional().default('dark'),
  editor: z.string().optional().default('default'),
});

export type Config = z.infer<typeof ConfigSchema>;
export type ProviderConfig = z.infer<typeof ProviderConfigSchema>;
export type MCPServerConfig = z.infer<typeof MCPServerConfigSchema>;
export type HookConfig = z.infer<typeof HookConfigSchema>;
export type PermissionRule = z.infer<typeof PermissionRuleSchema>;
