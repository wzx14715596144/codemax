import { describe, it, expect, beforeEach } from 'vitest';
import { SessionManager } from '../../src/session/manager';
import type { Message } from '../../src/provider/interface';

describe('SessionManager', () => {
  let session: SessionManager;

  beforeEach(() => {
    session = new SessionManager();
    session.start();
  });

  it('starts with empty messages', () => {
    expect(session.getMessages()).toEqual([]);
  });

  it('adds messages', () => {
    session.addMessage({ role: 'user', content: 'hello' });
    expect(session.getMessages()).toHaveLength(1);
    expect(session.getMessages()[0].content).toBe('hello');
  });

  it('clears all messages', () => {
    session.addMessage({ role: 'user', content: 'hello' });
    session.addMessage({ role: 'assistant', content: 'hi' });
    session.clear();
    expect(session.getMessages()).toEqual([]);
  });

  it('reports message count', () => {
    session.addMessage({ role: 'user', content: 'a' });
    session.addMessage({ role: 'assistant', content: 'b' });
    expect(session.getInfo().messageCount).toBe(2);
  });

  it('generates session id', () => {
    expect(session.getInfo().id).toBeTruthy();
  });

  it('compacts preserves system messages', () => {
    session.addMessage({ role: 'system', content: 'You are a helpful assistant' });
    session.addMessage({ role: 'user', content: 'hello' });
    session.addMessage({ role: 'assistant', content: 'hi' });
    session.compact();
    const msgs = session.getMessages();
    expect(msgs).toHaveLength(2);
    expect(msgs[0].content).toBe('You are a helpful assistant');
    expect(msgs[1].role).toBe('system');
  });

  it('compacts with custom instructions', () => {
    session.addMessage({ role: 'user', content: 'hello' });
    session.compact('Continuing the code review');
    const msgs = session.getMessages();
    expect(msgs).toHaveLength(1);
    expect(msgs[0].content).toContain('Continuing the code review');
  });

  it('estimates tokens', () => {
    const budget = 100;
    const text = 'a'.repeat(budget * 4);
    session.addMessage({ role: 'user', content: text });
    expect(session.getContextSize()).toBe(budget);
  });

  it('tracks context size through lifecycle', () => {
    expect(session.getContextSize()).toBe(0);
    session.addMessage({ role: 'user', content: 'test' });
    expect(session.getContextSize()).toBe(1);
    session.clear();
    expect(session.getContextSize()).toBe(0);
  });
});
