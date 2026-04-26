/**
 * Separate entry point for shell tools.
 *
 * Import from 'confused-ai-core/tools/shell' to use shell commands.
 * This is intentionally separated from the main tools barrel to avoid
 * child_process being bundled into the main package (supply chain security).
 *
 * @example
 * import { ShellTool, ShellToolkit } from 'confused-ai-core/tools/shell';
 *
 * const agent = new Agent({
 *   instructions: '...',
 *   tools: [new ShellTool({ baseDir: '/safe/dir', allowedCommands: ['ls', 'cat', 'grep'] })],
 * });
 */

export { ShellTool, ShellToolkit, type ShellToolConfig } from './shell-tool.js';
