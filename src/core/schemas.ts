/**
 * Type-safe I/O: input_schema and output_schema (Zod) for agent runs.
 */

import type { z } from 'zod';

/** Input schema for agent run (e.g. prompt + optional structured fields) */
export type InputSchema<T = unknown> = z.ZodType<T>;

/** Output schema for agent run (e.g. structured response) */
export type OutputSchema<T = unknown> = z.ZodType<T>;

/** Parsed input from user when inputSchema is used */
export type ParsedInput<T> = T;

/** Parsed output from agent when outputSchema is used */
export type ParsedOutput<T> = T;
