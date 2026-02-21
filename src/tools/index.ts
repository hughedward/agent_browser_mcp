import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BrowserManager } from '../browser/manager.js';
import { fillTool, fillToolDefinition } from './interaction/fill.js';
import { typeTool, typeToolDefinition } from './interaction/type.js';
import { clickTool } from './interaction/click.js';
import { hoverTool } from './interaction/hover.js';
import { scrollTool } from './interaction/scroll.js';
import { pressTool } from './interaction/press.js';
import { navigateTool, navigateToolDefinition } from './navigation/navigate.js';
import { closeTool, closeToolDefinition } from './navigation/close.js';
import { snapshotTool, handleSnapshot } from './discovery/snapshot.js';
import { screenshotTool, screenshotToolDefinition } from './discovery/screenshot.js';
import { waitTool, waitToolDefinition } from './wait/wait.js';
import { findToolHandler, findToolDefinition } from './finder/find.js';
import { getToolHandler, getToolDefinition } from './info/get.js';
import { isToolHandler, isToolDefinition } from './info/is.js';
import { cookiesToolHandler, cookiesToolDefinition } from './storage/cookies.js';
import { storageToolHandler, storageToolDefinition } from './storage/storage.js';
import { stateToolHandler, stateToolDefinition } from './state/state.js';
import { tabTool, tabToolDefinition } from './tabs/tab.js';
import { windowTool, windowToolDefinition } from './tabs/window.js';
import { setToolHandler, setToolDefinition } from './settings/set.js';
import { pdfToolHandler, pdfToolDefinition } from './export/pdf.js';
import { networkToolHandler, networkToolDefinition } from './network/network.js';
import { recordToolHandler, recordToolDefinition } from './recording/record.js';
import { consoleToolHandler, consoleToolDefinition } from './debug/console.js';
import { errorsToolHandler, errorsToolDefinition } from './debug/errors.js';
import { traceToolHandler, traceToolDefinition } from './debug/trace.js';
import { evaluateToolHandler, evaluateToolDefinition } from './debug/evaluate.js';

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
    browser_hover: async (args: any) => hoverTool.handler(args, browserManager),
    browser_scroll: async (args: any) => scrollTool.handler(args, browserManager),
    browser_press: async (args: any) => pressTool.handler(args, browserManager),
    browser_screenshot: async (args: any) => screenshotTool(browserManager, args),
    browser_close: async (args: any) => closeTool(browserManager),
    browser_wait: async (args: any) => waitTool(browserManager, args),
    browser_find: async (args: any) => findToolHandler(browserManager, args),
    browser_get: async (args: any) => getToolHandler(browserManager, args),
    browser_is: async (args: any) => isToolHandler(browserManager, args),
    browser_cookies: async (args: any) => cookiesToolHandler(browserManager, args),
    browser_storage: async (args: any) => storageToolHandler(browserManager, args),
    browser_state: async (args: any) => stateToolHandler(browserManager, args),
    browser_tab: async (args: any) => tabTool(browserManager, args),
    browser_window: async (args: any) => windowTool(browserManager, args),
    browser_set: async (args: any) => setToolHandler(browserManager, args),
    browser_pdf: async (args: any) => pdfToolHandler(browserManager, args),
    browser_network: async (args: any) => networkToolHandler(browserManager, args),
    browser_record: async (args: any) => recordToolHandler(browserManager, args),
    browser_console: async (args: any) => consoleToolHandler(browserManager, args),
    browser_errors: async (args: any) => errorsToolHandler(browserManager, args),
    browser_trace: async (args: any) => traceToolHandler(browserManager, args),
    browser_evaluate: async (args: any) => evaluateToolHandler(browserManager, args),
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
    {
      name: hoverTool.name,
      description: hoverTool.description,
      inputSchema: hoverTool.inputSchema,
    },
    {
      name: scrollTool.name,
      description: scrollTool.description,
      inputSchema: scrollTool.inputSchema,
    },
    {
      name: pressTool.name,
      description: pressTool.description,
      inputSchema: pressTool.inputSchema,
    },
    screenshotToolDefinition,
    closeToolDefinition,
    waitToolDefinition,
    findToolDefinition,
    getToolDefinition,
    isToolDefinition,
    cookiesToolDefinition,
    storageToolDefinition,
    stateToolDefinition,
    tabToolDefinition,
    windowToolDefinition,
    setToolDefinition,
    pdfToolDefinition,
    networkToolDefinition,
    recordToolDefinition,
    consoleToolDefinition,
    errorsToolDefinition,
    traceToolDefinition,
    evaluateToolDefinition,
  ];

  console.error(`  ✓ ${snapshotTool.name} (THE CORE TOOL FOR TOKEN OPTIMIZATION)`);
  console.error(`  ✓ ${navigateToolDefinition.name}`);
  console.error(`  ✓ ${fillToolDefinition.name}`);
  console.error(`  ✓ ${typeToolDefinition.name}`);
  console.error(`  ✓ ${clickTool.name}`);
  console.error(`  ✓ ${hoverTool.name}`);
  console.error(`  ✓ ${scrollTool.name}`);
  console.error(`  ✓ ${pressTool.name}`);
  console.error(`  ✓ ${screenshotToolDefinition.name}`);
  console.error(`  ✓ ${closeToolDefinition.name}`);
  console.error(`  ✓ ${waitToolDefinition.name}`);
  console.error(`  ✓ ${findToolDefinition.name}`);
  console.error(`  ✓ ${getToolDefinition.name}`);
  console.error(`  ✓ ${isToolDefinition.name}`);
  console.error(`  ✓ ${cookiesToolDefinition.name}`);
  console.error(`  ✓ ${storageToolDefinition.name}`);
  console.error(`  ✓ ${stateToolDefinition.name}`);
  console.error(`  ✓ ${tabToolDefinition.name}`);
  console.error(`  ✓ ${windowToolDefinition.name}`);
  console.error(`  ✓ ${setToolDefinition.name}`);
  console.error(`  ✓ ${pdfToolDefinition.name}`);
  console.error(`  ✓ ${networkToolDefinition.name}`);
  console.error(`  ✓ ${recordToolDefinition.name}`);
  console.error(`  ✓ ${consoleToolDefinition.name}`);
  console.error(`  ✓ ${errorsToolDefinition.name}`);
  console.error(`  ✓ ${traceToolDefinition.name}`);
  console.error(`  ✓ ${evaluateToolDefinition.name}`);
  console.error('All tools registered successfully');
}
