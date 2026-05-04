/**
 * @confused-ai/knowledge — package barrel.
 */

export { KnowledgeEngine, createKnowledgeEngine } from './knowledge-engine.js';
export type { RAGEngine, VectorStore, EmbeddingFn, Document, SearchResult, RAGChunk, RAGQueryOptions, RAGQueryResult } from './types.js';

// ── AgentDb-backed engine ──────────────────────────────────────────────────
export { DbKnowledgeEngine, DbVectorStore, createDbKnowledgeEngine } from './db-knowledge-store.js';
export type { DbKnowledgeEngineOptions } from './db-knowledge-store.js';
