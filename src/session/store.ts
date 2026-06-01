import * as fs from 'fs';
import * as path from 'path';
import { getConfigDir } from '../config';
import { logger } from '../utils';

interface SessionData {
  id: string;
  createdAt: string;
  updatedAt: string;
  messages: unknown[];
  model: string;
}

export class SessionStore {
  private dbPath: string;
  private sessions: SessionData[] = [];

  constructor() {
    this.dbPath = path.join(getConfigDir(), 'sessions.json');
    this.load();
  }

  private load() {
    try {
      if (fs.existsSync(this.dbPath)) {
        const raw = fs.readFileSync(this.dbPath, 'utf-8');
        this.sessions = JSON.parse(raw);
      }
    } catch (err) {
      if (err instanceof Error) logger.warn('Failed to load session store:', err.message);
      this.sessions = [];
    }
  }

  private save() {
    try {
      const dir = path.dirname(this.dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.dbPath, JSON.stringify(this.sessions, null, 2));
    } catch (err) {
      if (err instanceof Error) logger.warn('Failed to save session:', err.message);
    }
  }

  saveSession(id: string, messages: unknown[], model: string) {
    const now = new Date().toISOString();
    const existing = this.sessions.find((s) => s.id === id);

    if (existing) {
      existing.messages = messages;
      existing.model = model;
      existing.updatedAt = now;
    } else {
      this.sessions.push({ id, createdAt: now, updatedAt: now, messages, model });
    }

    this.save();
  }

  loadSession(id: string): { messages: unknown[]; model: string } | null {
    const session = this.sessions.find((s) => s.id === id);
    if (!session) return null;
    return { messages: session.messages, model: session.model };
  }

  listSessions(): Array<{ id: string; createdAt: string; updatedAt: string; model: string }> {
    return [...this.sessions]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 50)
      .map((s) => ({ id: s.id, createdAt: s.createdAt, updatedAt: s.updatedAt, model: s.model }));
  }

  deleteSession(id: string) {
    this.sessions = this.sessions.filter((s) => s.id !== id);
    this.save();
  }
}
