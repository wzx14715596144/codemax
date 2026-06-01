import { describe, it, expect } from 'vitest';
import { getModelId } from '../../src/utils/model-id';

describe('getModelId', () => {
  it('returns fallback for undefined', () => {
    expect(getModelId(undefined)).toBe('gpt-4o');
  });

  it('returns fallback for empty string', () => {
    expect(getModelId('')).toBe('gpt-4o');
  });

  it('uses custom fallback', () => {
    expect(getModelId(undefined, 'custom-model')).toBe('custom-model');
  });

  it('returns model when no slash present', () => {
    expect(getModelId('gpt-4o')).toBe('gpt-4o');
  });

  it('extracts model after provider/model format', () => {
    expect(getModelId('openai/gpt-4o')).toBe('gpt-4o');
  });

  it('extracts model from anthropic format', () => {
    expect(getModelId('anthropic/claude-sonnet-4-20250514')).toBe('claude-sonnet-4-20250514');
  });

  it('handles model with multiple slashes', () => {
    expect(getModelId('openrouter/anthropic/claude-sonnet-4')).toBe('anthropic/claude-sonnet-4');
  });
});
