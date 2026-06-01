import { describe, it, expect, beforeEach } from 'vitest';
import { toolRegistry } from '../../src/tools/registry';
import type { Tool } from '../../src/tools/types';

describe('ToolRegistry', () => {
  beforeEach(() => {
    // Clear registry by re-initializing
    for (const name of toolRegistry.getAllDefinitions().map((d) => d.name)) {
      toolRegistry.unregister(name);
    }
  });

  it('starts empty', () => {
    expect(toolRegistry.getAllDefinitions()).toEqual([]);
  });

  it('registers a tool', () => {
    const tool: Tool = {
      definition: { name: 'test', description: 'Test tool', inputSchema: {} },
      async execute() {
        return { success: true, output: 'done' };
      },
    };
    toolRegistry.register(tool);
    expect(toolRegistry.getAllDefinitions()).toHaveLength(1);
    expect(toolRegistry.getAllDefinitions()[0].name).toBe('test');
  });

  it('unregisters a tool', () => {
    const tool: Tool = {
      definition: { name: 'test', description: '', inputSchema: {} },
      async execute() {
        return { success: true, output: '' };
      },
    };
    toolRegistry.register(tool);
    toolRegistry.unregister('test');
    expect(toolRegistry.getAllDefinitions()).toEqual([]);
  });

  it('executes a tool', async () => {
    const tool: Tool = {
      definition: { name: 'echo', description: '', inputSchema: {} },
      async execute(args) {
        return { success: true, output: String(args.msg) };
      },
    };
    toolRegistry.register(tool);
    const result = await toolRegistry.execute('echo', { msg: 'hello' });
    expect(result.success).toBe(true);
    expect(result.output).toBe('hello');
  });

  it('returns error for unknown tool', async () => {
    const result = await toolRegistry.execute('nonexistent', {});
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unknown tool');
  });

  it('returns tool by name', () => {
    const tool: Tool = {
      definition: { name: 'test', description: '', inputSchema: {} },
      async execute() {
        return { success: true, output: '' };
      },
    };
    toolRegistry.register(tool);
    expect(toolRegistry.get('test')).toBeDefined();
    expect(toolRegistry.get('nope')).toBeUndefined();
  });
});
