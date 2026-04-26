/**
 * Knowledge: agentic RAG, hybrid search, reranking, persistent session/state.
 */

import type { EntityId } from '../core/types.js';

/** Single retrieved chunk for RAG */
export interface RAGChunk {
    readonly id: EntityId;
    readonly content: string;
    readonly score: number;
    readonly metadata?: Record<string, unknown>;
    readonly source?: string;
}

/** RAG query options */
export interface RAGQueryOptions {
    readonly limit?: number;
    readonly threshold?: number;
    readonly filter?: Record<string, unknown>;
    readonly rerank?: boolean;
    readonly hybrid?: boolean;
}

/** RAG query result */
export interface RAGQueryResult {
    readonly chunks: RAGChunk[];
    readonly query: string;
    readonly totalRetrieved?: number;
}

/** RAG engine: retrieve (and optionally generate). Plug 20+ vector stores, hybrid search, reranking. */
export interface RAGEngine {
    /** Retrieve relevant chunks for a query (vector + optional keyword + rerank) */
    retrieve(query: string, options?: RAGQueryOptions): Promise<RAGQueryResult>;

    /** Optional: generate answer from query + retrieved context (agentic RAG) */
    generate?(query: string, options?: RAGQueryOptions & { maxTokens?: number }): Promise<{ answer: string; chunks: RAGChunk[] }>;

    /** Ingest documents/chunks for later retrieval */
    ingest?(chunks: Array<{ content: string; metadata?: Record<string, unknown> }>): Promise<void>;
}

/** Hybrid search: combine vector similarity + keyword (e.g. BM25). */
export interface HybridSearchProvider {
    search(query: string, limit: number, filter?: Record<string, unknown>): Promise<RAGChunk[]>;
}

/** Reranker: score and reorder retrieved chunks. */
export interface RerankerProvider {
    rerank(query: string, chunks: RAGChunk[], topK?: number): Promise<RAGChunk[]>;
}
