/**
 * LLM-based planner implementation
 */

import {
    Planner,
    Plan,
    PlanContext,
    PlanFeedback,
    ValidationResult,
    Task,
    TaskPriority,
    LLMPlannerConfig,
} from './types.js';
import type { EntityId } from '../core/types.js';

/**
 * LLM provider interface for planning
 */
interface LLMProvider {
    generateText(prompt: string, options?: { temperature?: number; maxTokens?: number }): Promise<string>;
}

/**
 * LLM-based planner that uses language models for task decomposition
 */
export class LLMPlanner implements Planner {
    private config: Required<LLMPlannerConfig>;
    private llmProvider: LLMProvider;

    constructor(config: LLMPlannerConfig, llmProvider: LLMProvider) {
        this.config = {
            maxIterations: config.maxIterations ?? 10,
            timeoutMs: config.timeoutMs ?? 60000,
            allowParallelExecution: config.allowParallelExecution ?? true,
            retryPolicy: config.retryPolicy ?? {
                maxRetries: 3,
                backoffMs: 1000,
                maxBackoffMs: 30000,
                exponentialBase: 2,
            },
            model: config.model,
            temperature: config.temperature ?? 0.7,
            maxTokens: config.maxTokens ?? 2000,
            systemPrompt: config.systemPrompt ?? this.getDefaultSystemPrompt(),
        };
        this.llmProvider = llmProvider;
    }

    async plan(goal: string, context?: PlanContext): Promise<Plan> {
        const planId = this.generateId();

        // Build the planning prompt
        const prompt = this.buildPlanningPrompt(goal, context);

        // Generate plan from LLM
        const response = await this.llmProvider.generateText(prompt, {
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
        });

        // Parse tasks from LLM response
        const tasks = this.parseTasksFromResponse(response, context);

        // Build dependencies
        this.buildDependencies(tasks);

        const plan: Plan = {
            id: planId,
            goal,
            tasks,
            createdAt: new Date(),
            metadata: {
                plannerType: 'llm',
                estimatedTotalDurationMs: this.calculateTotalDuration(tasks),
                confidence: this.estimateConfidence(tasks, response),
                context: context?.metadata,
            },
        };

        return plan;
    }

    async refine(plan: Plan, feedback: PlanFeedback): Promise<Plan> {
        const prompt = this.buildRefinementPrompt(plan, feedback);

        const response = await this.llmProvider.generateText(prompt, {
            temperature: this.config.temperature,
            maxTokens: this.config.maxTokens,
        });

        const refinedTasks = this.parseTasksFromResponse(response);

        // Build dependencies
        this.buildDependencies(refinedTasks);

        return {
            ...plan,
            tasks: refinedTasks,
            metadata: {
                ...plan.metadata,
                confidence: (plan.metadata.confidence ?? 0.5) * 0.9,
            },
        };
    }

    validate(plan: Plan): ValidationResult {
        const errors: ValidationResult['errors'] = [];

        // Check for circular dependencies
        const visited = new Set<EntityId>();
        const recursionStack = new Set<EntityId>();

        const hasCycle = (taskId: EntityId, taskMap: Map<EntityId, Task>): boolean => {
            visited.add(taskId);
            recursionStack.add(taskId);

            const task = taskMap.get(taskId);
            if (task) {
                for (const depId of task.dependencies) {
                    if (!visited.has(depId)) {
                        if (hasCycle(depId, taskMap)) {
                            return true;
                        }
                    } else if (recursionStack.has(depId)) {
                        return true;
                    }
                }
            }

            recursionStack.delete(taskId);
            return false;
        };

        const taskMap = new Map(plan.tasks.map(t => [t.id, t]));

        for (const task of plan.tasks) {
            if (!visited.has(task.id)) {
                if (hasCycle(task.id, taskMap)) {
                    errors.push({
                        taskId: task.id,
                        message: 'Circular dependency detected',
                        severity: 'error',
                    });
                }
            }

            // Check for missing dependencies
            for (const depId of task.dependencies) {
                if (!taskMap.has(depId)) {
                    errors.push({
                        taskId: task.id,
                        message: `Missing dependency: ${depId}`,
                        severity: 'error',
                    });
                }
            }

            // Validate task structure
            if (!task.name || task.name.trim().length === 0) {
                errors.push({
                    taskId: task.id,
                    message: 'Task name is required',
                    severity: 'error',
                });
            }
        }

        return {
            valid: errors.length === 0,
            errors,
        };
    }

    /**
     * Build the planning prompt for the LLM
     */
    private buildPlanningPrompt(goal: string, context?: PlanContext): string {
        const availableTools = context?.availableTools?.join(', ') ?? 'None specified';
        const constraints = context?.constraints?.join('\n') ?? 'None specified';
        const memory = context?.memory?.join('\n') ?? 'None available';

        return `${this.config.systemPrompt}

Goal: ${goal}

Available Tools: ${availableTools}

Constraints:
${constraints}

Relevant Context from Memory:
${memory}

Please break down this goal into a sequence of tasks. For each task, provide:
1. Task name (short, descriptive)
2. Task description (detailed)
3. Priority (CRITICAL, HIGH, MEDIUM, LOW)
4. Estimated duration in milliseconds (optional)

Format your response as JSON:
{
  "tasks": [
    {
      "name": "Task Name",
      "description": "Detailed description of what this task does",
      "priority": "HIGH",
      "estimatedDurationMs": 5000
    }
  ]
}`;
    }

    /**
     * Build the refinement prompt
     */
    private buildRefinementPrompt(plan: Plan, feedback: PlanFeedback): string {
        const tasksJson = JSON.stringify(plan.tasks, null, 2);

        return `${this.config.systemPrompt}

The following plan failed during execution:

Goal: ${plan.goal}

Current Tasks:
${tasksJson}

Failed Task: ${feedback.failedTaskId ?? 'Unknown'}
Error: ${feedback.error ?? 'Unknown error'}

Suggestions for improvement:
${feedback.suggestions?.join('\n') ?? 'None provided'}

Please provide a refined plan that addresses these issues. Return the complete updated task list in the same JSON format.`;
    }

    /**
     * Parse tasks from LLM response
     */
    private parseTasksFromResponse(response: string, context?: PlanContext): Task[] {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);
            const taskData = parsed.tasks ?? parsed;

            if (!Array.isArray(taskData)) {
                throw new Error('Expected tasks array in response');
            }

            return taskData.map((data: Record<string, unknown>, index: number) => ({
                id: this.generateId(),
                name: String(data.name ?? `Task ${index + 1}`),
                description: String(data.description ?? ''),
                dependencies: Array.isArray(data.dependencies) ? data.dependencies : [],
                estimatedDurationMs: typeof data.estimatedDurationMs === 'number'
                    ? data.estimatedDurationMs
                    : undefined,
                priority: this.parsePriority(data.priority),
                metadata: {
                    toolIds: context?.availableTools,
                    ...((data.metadata as Record<string, unknown>) ?? {}),
                },
            }));
        } catch (error) {
            // Fallback: create a single task with the raw response
            return [{
                id: this.generateId(),
                name: 'Execute Plan',
                description: response,
                dependencies: [],
                priority: TaskPriority.MEDIUM,
                metadata: {},
            }];
        }
    }

    /**
     * Parse priority from string
     */
    private parsePriority(priority: unknown): TaskPriority {
        const priorityMap: Record<string, TaskPriority> = {
            'CRITICAL': TaskPriority.CRITICAL,
            'HIGH': TaskPriority.HIGH,
            'MEDIUM': TaskPriority.MEDIUM,
            'LOW': TaskPriority.LOW,
        };

        return priorityMap[String(priority).toUpperCase()] ?? TaskPriority.MEDIUM;
    }

    /**
     * Build task dependencies
     */
    private buildDependencies(tasks: Task[]): void {
        // Simple sequential dependency for tasks without explicit dependencies
        for (let i = 1; i < tasks.length; i++) {
            const task = tasks[i];
            if (task.dependencies.length === 0) {
                Object.assign(task, {
                    dependencies: [tasks[i - 1].id],
                });
            }
        }
    }

    /**
     * Calculate total plan duration
     */
    private calculateTotalDuration(tasks: Task[]): number {
        return tasks.reduce((sum, task) => sum + (task.estimatedDurationMs ?? 5000), 0);
    }

    /**
     * Estimate confidence based on response quality
     */
    private estimateConfidence(tasks: Task[], response: string): number {
        // Simple heuristic based on task count and response length
        const baseConfidence = 0.7;
        const taskBonus = Math.min(tasks.length * 0.05, 0.2);
        const lengthBonus = response.length > 500 ? 0.1 : 0;

        return Math.min(baseConfidence + taskBonus + lengthBonus, 1.0);
    }

    /**
     * Generate a unique ID
     */
    private generateId(): EntityId {
        return `llm-task-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Get the default system prompt
     */
    private getDefaultSystemPrompt(): string {
        return `You are an expert task planner. Your role is to break down complex goals into manageable, sequential tasks.

Guidelines:
- Create clear, actionable tasks
- Consider dependencies between tasks
- Assign appropriate priorities
- Estimate realistic durations
- Use available tools effectively

Respond with valid JSON only.`;
    }
}