/**
 * SQLite session store via `bun:sqlite` (Bun runtime only).
 *
 * `better-sqlite3` does not load under Bun; use this when running with `bun`.
 * From Node, use {@link createSqliteSessionStore} instead.
 */

import { Database, type SQLQueryBindings } from 'bun:sqlite';
import type { SessionDbDriver } from './db-driver.js';
import type { SessionStore, SessionStoreConfig } from './types.js';
import { SqlSessionStore } from './sql-store.js';

/**
 * Open a SQLite file and return a migrated {@link SqlSessionStore} backed by Bun's SQLite.
 */
export async function createBunSqliteSessionStore(
    filePath: string,
    config?: SessionStoreConfig & { tablePrefix?: string }
): Promise<SessionStore> {
    const db = new Database(filePath, { create: true });
    try {
        db.run('PRAGMA journal_mode = WAL;');
    } catch {
        /* ignore if unsupported */
    }

    const driver: SessionDbDriver = {
        async query<T = Record<string, unknown>>(sql: string, params: unknown[] = []): Promise<T[]> {
            const bindings = params as SQLQueryBindings[];
            return db.query(sql).all(...bindings) as T[];
        },
        async run(sql: string, params: unknown[] = []): Promise<void> {
            if (params.length === 0) {
                db.run(sql);
            } else {
                const bindings = params as SQLQueryBindings[];
                db.query(sql).run(...bindings);
            }
        },
        async exec(sql: string): Promise<void> {
            db.run(sql);
        },
    };

    const store = new SqlSessionStore(driver, config);
    await store.migrate();
    return store;
}
