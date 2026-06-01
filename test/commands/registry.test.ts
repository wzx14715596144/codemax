import { describe, it, expect, beforeEach } from 'vitest';
import { CommandRegistry } from '../../src/commands/registry';
import type { Command } from '../../src/commands/registry';

describe('CommandRegistry', () => {
  let registry: CommandRegistry;

  beforeEach(() => {
    registry = new CommandRegistry();
  });

  it('registers and finds commands by name', () => {
    const cmd: Command = { name: 'test', description: 'Test', execute() {} };
    registry.register(cmd);
    expect(registry.find('/test')).toBeDefined();
  });

  it('trims whitespace in find', () => {
    const cmd: Command = { name: 'test', description: '', execute() {} };
    registry.register(cmd);
    expect(registry.find('  /test  ')).toBeDefined();
  });

  it('finds commands via aliases', () => {
    const cmd: Command = { name: 'help', aliases: ['?', 'h'], description: '', execute() {} };
    registry.register(cmd);
    expect(registry.find('/?')).toBeDefined();
    expect(registry.find('/h')).toBeDefined();
    expect(registry.find('/help')).toBeDefined();
  });

  it('returns undefined for unknown command', () => {
    expect(registry.find('/nonexistent')).toBeUndefined();
  });

  it('getAll deduplicates aliases', () => {
    const cmd: Command = { name: 'help', aliases: ['?', 'h'], description: '', execute() {} };
    registry.register(cmd);
    expect(registry.getAll()).toHaveLength(1);
    expect(registry.getNames()).toEqual(['help']);
  });

  it('getAll returns all unique commands', () => {
    const cmd1: Command = { name: 'help', description: '', execute() {} };
    const cmd2: Command = { name: 'clear', description: '', execute() {} };
    registry.register(cmd1);
    registry.register(cmd2);
    expect(registry.getAll()).toHaveLength(2);
  });
});
