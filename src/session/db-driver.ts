/**
 * Database driver interface for session persistence.
 * Implement for SQLite, PostgreSQL, or any SQL-compatible store.
 */

/**
 * Minimal SQL driver: run queries and execute statements.
 * Plug any DB by implementing this interface.
 */
export interface SessionDbDriver {
    /** Run a SELECT and return rows */
    query<T = Record<string, unknown>>(sql: string, params?: unknown[]): Promise<T[]>;

    /** Run INSERT/UPDATE/DELETE; no return value */
    run(sql: string, params?: unknown[]): Promise<void>;

    /** Run DDL (e.g. CREATE TABLE). Optional; use run() if not supported. */
    exec?(sql: string): Promise<void>;
}

/**
 * Row shape for sessions table (driver-agnostic)
 */
export interface SessionRow {
    id: string;
    agent_id: string;
    user_id: string | null;
    state: string;
    messages: string;
    metadata: string;
    context: string;
    created_at: string;
    updated_at: string;
    expires_at: string | null;
}

/**
 * Row shape for session_runs table
 */
export interface SessionRunRow {
    id: string;
    session_id: string;
    agent_id: string;
    start_time: string;
    end_time: string | null;
    status: string;
    steps: number;
    result: string | null;
    error: string | null;
}
