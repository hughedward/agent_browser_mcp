import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BrowserManager } from '../browser/manager.js';
import { fillTool, fillToolDefinition } from './interaction/fill.js';
import { typeTool, typeToolDefinition } from './interaction/type.js';
import { clickTool } from './interaction/click.js';
import { navigateTool, navigateToolDefinition } from './navigation/navigate.js';
import { snapshotTool, handleSnapshot } from './discovery/snapshot.js';

/**
 * Register all tools with the MCP server
 */
export async function registerAllTools(
  server: Server,
  browserManager: BrowserManager
): Promise<void> {
  // Store tool handlers and definitions for later use
  (server as any).__toolHandlers = {
    browser_snapshot: async (args: any) => handleSnapshot(browserManager, args),
    browser_navigate: async (args: any) => navigateTool(browserManager, args),
    browser_fill: async (args: any) => fillTool(browserManager, args),
    browser_type: async (args: any) => typeTool(browserManager, args),
    browser_click: async (args: any) => clickTool.handler(args, browserManager),
  };

  (server as any).__toolDefinitions = [
    snapshotTool,
    navigateToolDefinition,
    fillToolDefinition,
    typeToolDefinition,
    {
      name: clickTool.name,
      description: clickTool.description,
      inputSchema: clickTool.inputSchema,
    },
  ];

  console.error(`  ✓ ${snapshotTool.name} (THE CORE TOOL FOR TOKEN OPTIMIZATION)`);
  console.error(`  ✓ ${navigateToolDefinition.name}`);
  console.error(`  ✓ ${fillToolDefinition.name}`);
  console.error(`  ✓ ${typeToolDefinition.name}`);
  console.error(`  ✓ ${clickTool.name}`);
  console.error('All tools registered successfully');
}
