/**
 * Structured persona → system instructions.
 * Compose role, tone, and constraints, then pass the string to `Agent`, `createAgent`, or `defineAgent().instructions(...)`.
 */

export interface AgentPersona {
    /** Short label (logs, UI); often matches the agent `name` */
    displayName: string;
    /** One line: who this agent is */
    role: string;
    /** Topics or skills to emphasize */
    expertise?: string[];
    /** Voice: e.g. "warm and concise", "formal", "Socratic" */
    tone?: string;
    /** Who the user is (student, exec, engineer, …) */
    audience?: string;
    /** Hard limits: what not to do or say */
    constraints?: string[];
    /** How to format answers (bullets, code samples, step-by-step, …) */
    responseStyle?: string;
    /** Extra context: company policy, product facts, domain glossary */
    context?: string;
}

/**
 * Render a persona as a single system prompt.
 */
export function buildPersonaInstructions(persona: AgentPersona): string {
    const blocks: string[] = [];

    blocks.push(`You are **${persona.displayName}**.`);
    blocks.push('');
    blocks.push(`**Role:** ${persona.role}`);

    if (persona.expertise?.length) {
        blocks.push('');
        blocks.push('**Expertise:**');
        for (const line of persona.expertise) {
            blocks.push(`- ${line}`);
        }
    }

    if (persona.tone?.trim()) {
        blocks.push('');
        blocks.push(`**Tone:** ${persona.tone.trim()}`);
    }

    if (persona.audience?.trim()) {
        blocks.push('');
        blocks.push(`**Audience:** ${persona.audience.trim()}`);
    }

    if (persona.responseStyle?.trim()) {
        blocks.push('');
        blocks.push(`**How to respond:** ${persona.responseStyle.trim()}`);
    }

    if (persona.constraints?.length) {
        blocks.push('');
        blocks.push('**Constraints:**');
        for (const line of persona.constraints) {
            blocks.push(`- ${line}`);
        }
    }

    if (persona.context?.trim()) {
        blocks.push('');
        blocks.push('**Context:**');
        blocks.push(persona.context.trim());
    }

    blocks.push('');
    blocks.push('Stay in character. If something is unknown or unsafe, say so plainly instead of guessing.');

    return blocks.join('\n');
}

class PersonaBuilder {
    constructor(private readonly persona: Partial<AgentPersona>) {}

    displayName(name: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, displayName: name });
    }

    role(role: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, role });
    }

    expertise(items: string[]): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, expertise: [...items] });
    }

    tone(tone: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, tone });
    }

    audience(audience: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, audience });
    }

    constraints(items: string[]): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, constraints: [...items] });
    }

    responseStyle(style: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, responseStyle: style });
    }

    context(text: string): PersonaBuilder {
        return new PersonaBuilder({ ...this.persona, context: text });
    }

    /**
     * Validate required fields and return a plain {@link AgentPersona}.
     */
    build(): AgentPersona {
        const { displayName, role } = this.persona;
        if (!displayName?.trim()) {
            throw new Error('definePersona().build() requires .displayName("...").');
        }
        if (!role?.trim()) {
            throw new Error('definePersona().build() requires .role("...").');
        }
        return {
            displayName: displayName.trim(),
            role: role.trim(),
            expertise: this.persona.expertise,
            tone: this.persona.tone?.trim() || undefined,
            audience: this.persona.audience?.trim() || undefined,
            constraints: this.persona.constraints,
            responseStyle: this.persona.responseStyle?.trim() || undefined,
            context: this.persona.context?.trim() || undefined,
        };
    }

    /** Shorthand: `build()` + {@link buildPersonaInstructions}. */
    instructions(): string {
        return buildPersonaInstructions(this.build());
    }
}

/**
 * Fluent persona builder. Call `.displayName()` and `.role()` before `.build()` or `.instructions()`.
 *
 * @example
 * ```ts
 * const instructions = definePersona()
 *   .displayName('DocsBot')
 *   .role('Technical writer who explains APIs clearly.')
 *   .tone('Friendly, concise')
 *   .expertise(['OpenAPI', 'TypeScript'])
 *   .constraints(['Never invent endpoint paths'])
 *   .instructions();
 *
 * const agent = new Agent({ name: 'DocsBot', instructions });
 * ```
 */
export function definePersona(): PersonaBuilder {
    return new PersonaBuilder({});
}
