/**
 * Document loaders for the knowledge engine.
 *
 * Load content from various sources (text, JSON, CSV, URLs)
 * into DocumentInput format for ingestion into KnowledgeEngine.
 */

import type { DocumentInput } from './engine.js';

/** Base loader interface */
export interface DocumentLoader {
    load(): Promise<DocumentInput[]>;
}

/**
 * Load plain text as a single document.
 */
export class TextLoader implements DocumentLoader {
    constructor(
        private content: string,
        private metadata?: Record<string, unknown>
    ) {}

    async load(): Promise<DocumentInput[]> {
        return [{ content: this.content, source: 'text', metadata: this.metadata }];
    }
}

/**
 * Load a JSON array of objects, converting each to a document.
 * Each object is stringified as the document content.
 */
export class JSONLoader implements DocumentLoader {
    constructor(
        private data: Record<string, unknown>[],
        private contentField?: string,
        private metadata?: Record<string, unknown>
    ) {}

    async load(): Promise<DocumentInput[]> {
        return this.data.map((item, i) => ({
            content: this.contentField
                ? String(item[this.contentField] ?? JSON.stringify(item))
                : JSON.stringify(item),
            source: `json:${i}`,
            metadata: { ...this.metadata, index: i },
        }));
    }
}

/**
 * Load CSV text, converting each row to a document.
 */
export class CSVLoader implements DocumentLoader {
    constructor(
        private csvText: string,
        private options?: { delimiter?: string; contentColumns?: string[] }
    ) {}

    async load(): Promise<DocumentInput[]> {
        const delimiter = this.options?.delimiter ?? ',';
        const lines = this.csvText.trim().split('\n');
        if (lines.length < 2) return [];

        const headers = this.parseLine(lines[0], delimiter);
        const contentCols = this.options?.contentColumns ?? headers;

        const docs: DocumentInput[] = [];
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseLine(lines[i], delimiter);
            const row: Record<string, string> = {};
            headers.forEach((h, idx) => { row[h] = values[idx] ?? ''; });

            const content = contentCols
                .map(col => `${col}: ${row[col] ?? ''}`)
                .join('\n');

            docs.push({
                content,
                source: `csv:row-${i}`,
                metadata: row,
            });
        }
        return docs;
    }

    private parseLine(line: string, delimiter: string): string[] {
        const result: string[] = [];
        let current = '';
        let inQuotes = false;

        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === delimiter && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        result.push(current.trim());
        return result;
    }
}

/**
 * Load content from a URL (fetches the page and extracts text).
 */
export class URLLoader implements DocumentLoader {
    constructor(
        private url: string,
        private options?: { headers?: Record<string, string> }
    ) {}

    async load(): Promise<DocumentInput[]> {
        const response = await fetch(this.url, {
            headers: {
                Accept: 'text/html, text/plain, application/json, */*',
                'User-Agent': 'ConfusedAI-KnowledgeLoader/1.0',
                ...this.options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`URLLoader: Failed to fetch ${this.url}: ${response.status}`);
        }

        const contentType = response.headers.get('content-type') ?? '';
        const text = await response.text();

        let content: string;
        if (contentType.includes('text/html')) {
            content = this.stripHtml(text);
        } else {
            content = text;
        }

        return [{
            content,
            source: this.url,
            metadata: { contentType, fetchedAt: new Date().toISOString() },
        }];
    }

    private stripHtml(html: string): string {
        return html
            .replace(/<script[\s\S]*?<\/script>/gi, ' ')
            .replace(/<style[\s\S]*?<\/style>/gi, ' ')
            .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
            .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .replace(/&nbsp;/g, ' ')
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .trim();
    }
}
