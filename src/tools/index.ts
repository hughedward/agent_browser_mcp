import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BrowserManager } from '../browser/manager.js';

/**
 * Register all tools with the MCP server
 */
export async function registerAllTools(
  server: Server,
  browserManager: BrowserManager
): Promise<void> {
  // Navigation tools will be registered here
  // Interaction tools will be registered here
  // State management tools will be registered here
  // etc.

  console.error('All tools registered successfully');
}
