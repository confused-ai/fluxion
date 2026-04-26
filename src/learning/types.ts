/**
 * Learning: user profiles, memories that accumulate, knowledge that transfers.
 * Supports always-on or agentic learning modes.
 */

import type { EntityId } from '../core/types.js';

/** Learning mode: always persist/learn vs. only when agent explicitly stores */
export enum LearningMode {
    /** Always: persist session, accumulate memories, update profiles automatically */
    ALWAYS = 'always',
    /** Agentic: agent decides when to store/update (e.g. via tools) */
    AGENTIC = 'agentic',
}

/** User profile that persists across sessions */
export interface UserProfile {
    readonly id: EntityId;
    readonly userId: string;
    readonly agentId?: EntityId;
    readonly displayName?: string;
    readonly preferences?: Record<string, unknown>;
    readonly metadata: Record<string, unknown>;
    readonly createdAt: Date;
    readonly updatedAt: Date;
}

/** Query for user profiles */
export interface UserProfileQuery {
    readonly userId?: string;
    readonly agentId?: EntityId;
    readonly limit?: number;
}

/** Store for user profiles (plug any DB) */
export interface UserProfileStore {
    get(userId: string, agentId?: EntityId): Promise<UserProfile | null>;
    set(profile: Omit<UserProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserProfile>;
    update(userId: string, updates: Partial<Omit<UserProfile, 'id' | 'userId' | 'createdAt'>>, agentId?: EntityId): Promise<UserProfile>;
    list(query?: UserProfileQuery): Promise<UserProfile[]>;
    delete(userId: string, agentId?: EntityId): Promise<boolean>;
}
