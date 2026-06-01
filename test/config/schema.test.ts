import { describe, it, expect } from 'vitest';
import { ConfigSchema } from '../../src/config/schema';

describe('ConfigSchema', () => {
  it('parses empty config with defaults', () => {
    const result = ConfigSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.model).toBe('openai/gpt-4o');
      expect(result.data.providers).toEqual({});
      expect(result.data.mcpServers).toEqual({});
      expect(result.data.theme).toBe('dark');
    }
  });

  it('parses permissions with defaults', () => {
    const result = ConfigSchema.safeParse({ permissions: {} });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.permissions?.default).toBe('ask');
      expect(result.data.permissions?.allow).toEqual([]);
      expect(result.data.permissions?.deny).toEqual([]);
    }
  });

  it('parses full config', () => {
    const config = {
      model: 'anthropic/claude-sonnet-4-20250514',
      providers: {
        openai: { apiKey: 'sk-abc' },
        anthropic: { apiKey: 'sk-ant-abc' },
      },
      mcpServers: {
        filesystem: { command: 'npx', args: ['-y', '@modelcontextprotocol/server-filesystem'], type: 'stdio' },
      },
      permissions: { default: 'allow' as const },
      theme: 'light' as const,
    };
    const result = ConfigSchema.safeParse(config);
    expect(result.success).toBe(true);
  });

  it('rejects invalid theme', () => {
    const result = ConfigSchema.safeParse({ theme: 'blue' });
    expect(result.success).toBe(false);
  });

  it('rejects missing apiKey for openai', () => {
    const result = ConfigSchema.safeParse({ providers: { openai: {} } });
    expect(result.success).toBe(false);
  });

  it('allows ollama without apiKey', () => {
    const result = ConfigSchema.safeParse({ providers: { ollama: {} } });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.providers?.ollama?.baseUrl).toBe('http://localhost:11434');
    }
  });

  it('requires apiKey and endpoint for azure', () => {
    const result = ConfigSchema.safeParse({ providers: { azure: { apiKey: 'key', endpoint: 'https://example.com', deploymentName: 'gpt-4o' } } });
    expect(result.success).toBe(true);
  });
});
