/**
 * @confused-ai/session — DbSessionStore.
 *
 * Implements SessionStore backed by any AgentDb backend.
 * Messages are stored in session_data.messages so they survive process restarts.
 *
 * Usage:
 * ```ts
 * import { SqliteAgentDb } from '@confused-ai/db';
 * import { DbSessionStore } from '@confused-ai/session';
 *
 * const db    = new SqliteAgentDb({ path: './data/agent.db' });
 * const store = new DbSessionStore(db);
 * ```
 */

import type { AgentDb } from '@confused-ai/db';
import type { SessionStore, SessionData, SessionMessage } from './types.js';

function genId(): string {
  return `session-${String(Date.now())}-${Math.random().toString(36).slice(2, 9)}`;
}

function now(): number { return Math.floor(Date.now() / 1000); }

interface SessionDataBlob {
  messages: SessionMessage[];
  metadata?: Record<string, unknown>;
}

export class DbSessionStore implements SessionStore {
  constructor(private readonly db: AgentDb) {}

  async get(id: string): Promise<SessionData | undefined> {
    await this.db.init();
    const row = await this.db.getSession(id);
    if (!row) return undefined;
    return this._rowToSession(row);
  }

  async create(
    data: { agentId: string; userId?: string; messages?: SessionMessage[] } | string,
  ): Promise<SessionData> {
    await this.db.init();
    const id      = typeof data === 'string' ? data : genId();
    const agentId = typeof data === 'string' ? 'unknown' : data.agentId;
    const userId  = typeof data === 'string' ? undefined  : data.userId;
    const messages = typeof data === 'string' ? [] : (data.messages ?? []);
    const ts = now();

    await this.db.upsertSession({
      sessionId:   id,
      sessionType: 'agent',
      agentId,
      ...(userId !== undefined && { userId }),
      sessionData: { messages },
    });

    return {
      id,
      agentId,
      messages,
      createdAt: ts,
      updatedAt: ts,
      ...(userId !== undefined && { userId }),
    };
  }

  async update(id: string, data: { messages: SessionMessage[] }): Promise<void> {
    await this.db.init();
    const existing = await this.db.getSession(id);
    const existingBlob = existing?.session_data
      ? (JSON.parse(existing.session_data) as SessionDataBlob)
      : { messages: [] };

    await this.db.upsertSession({
      sessionId:   id,
      sessionType: (existing?.session_type ?? 'agent') as 'agent' | 'team' | 'workflow',
      ...(existing?.agent_id != null && { agentId: existing.agent_id }),
      ...(existing?.user_id  != null && { userId:  existing.user_id }),
      sessionData: { ...existingBlob, messages: data.messages },
    });
  }

  async getMessages(id: string): Promise<SessionMessage[]> {
    await this.db.init();
    const row = await this.db.getSession(id);
    if (!row?.session_data) return [];
    try {
      const blob = JSON.parse(row.session_data) as SessionDataBlob;
      return blob.messages ?? [];
    } catch { return []; }
  }

  async appendMessage(id: string, message: SessionMessage): Promise<void> {
    const messages = await this.getMessages(id);
    await this.update(id, { messages: [...messages, message] });
  }

  async delete(id: string): Promise<void> {
    await this.db.init();
    await this.db.deleteSession(id);
  }

  // ── private helpers ──────────────────────────────────────────────────────

  private _rowToSession(row: Awaited<ReturnType<AgentDb['getSession']>>): SessionData {
    if (!row) throw new Error('row is null');
    let messages: SessionMessage[] = [];
    if (row.session_data) {
      try {
        const blob = JSON.parse(row.session_data) as SessionDataBlob;
        messages = blob.messages ?? [];
      } catch { /* leave empty */ }
    }
    return {
      id:        row.session_id,
      agentId:   row.agent_id   ?? 'unknown',
      messages,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      ...(row.user_id != null && { userId: row.user_id }),
    };
  }
}

/** Convenience factory. */
export function createDbSessionStore(db: AgentDb): DbSessionStore {
  return new DbSessionStore(db);
}
