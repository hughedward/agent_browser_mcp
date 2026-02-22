import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { BrowserManager } from '../browser/manager.js';
import { fillTool, fillToolDefinition } from './interaction/fill.js';
import { typeTool, typeToolDefinition } from './interaction/type.js';
import { clickTool } from './interaction/click.js';
import { hoverTool } from './interaction/hover.js';
import { scrollTool } from './interaction/scroll.js';
import { pressTool } from './interaction/press.js';
import { selectTool, selectToolDefinition } from './interaction/select.js';
import { checkTool, checkToolDefinition } from './interaction/check.js';
import { uncheckTool, uncheckToolDefinition } from './interaction/uncheck.js';
import { dragTool, dragToolDefinition } from './interaction/drag.js';
import { uploadTool, uploadToolDefinition } from './interaction/upload.js';
import { dblclickTool, dblclickToolDefinition } from './interaction/dblclick.js';
import { focusTool, focusToolDefinition } from './interaction/focus.js';
import { navigateTool, navigateToolDefinition } from './navigation/navigate.js';
import { closeTool, closeToolDefinition } from './navigation/close.js';
import { backTool, backToolDefinition } from './navigation/back.js';
import { forwardTool, forwardToolDefinition } from './navigation/forward.js';
import { reloadTool, reloadToolDefinition } from './navigation/reload.js';
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
import { highlightToolHandler, highlightToolDefinition } from './debug/highlight.js';
import { profilerToolHandler, profilerToolDefinition } from './debug/profiler.js';
import { diffTool, diffToolDefinition } from './advanced/diff.js';
import { dialogTool, dialogToolDefinition } from './advanced/dialog.js';
import { frameTool, frameToolDefinition } from './advanced/frame.js';
import { mouseTool, mouseToolDefinition } from './advanced/mouse.js';
import { downloadTool, downloadToolDefinition } from './advanced/download.js';

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
    browser_select: async (args: any) => selectTool(browserManager, args),
    browser_check: async (args: any) => checkTool(browserManager, args),
    browser_uncheck: async (args: any) => uncheckTool(browserManager, args),
    browser_drag: async (args: any) => dragTool(browserManager, args),
    browser_upload: async (args: any) => uploadTool(browserManager, args),
    browser_dblclick: async (args: any) => dblclickTool(browserManager, args),
    browser_focus: async (args: any) => focusTool(browserManager, args),
    browser_screenshot: async (args: any) => screenshotTool(browserManager, args),
    browser_close: async (args: any) => closeTool(browserManager),
    browser_back: async (args: any) => backTool(browserManager),
    browser_forward: async (args: any) => forwardTool(browserManager),
    browser_reload: async (args: any) => reloadTool(browserManager, args),
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
    browser_highlight: async (args: any) => highlightToolHandler(browserManager, args),
    browser_profiler: async (args: any) => profilerToolHandler(browserManager, args),
    browser_diff: async (args: any) => diffTool(browserManager, args),
    browser_dialog: async (args: any) => dialogTool(browserManager, args),
    browser_frame: async (args: any) => frameTool(browserManager, args),
    browser_mouse: async (args: any) => mouseTool(browserManager, args),
    browser_download: async (args: any) => downloadTool(browserManager, args),
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
    selectToolDefinition,
    checkToolDefinition,
    uncheckToolDefinition,
    dragToolDefinition,
    uploadToolDefinition,
    dblclickToolDefinition,
    focusToolDefinition,
    screenshotToolDefinition,
    closeToolDefinition,
    backToolDefinition,
    forwardToolDefinition,
    reloadToolDefinition,
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
    highlightToolDefinition,
    profilerToolDefinition,
    diffToolDefinition,
    dialogToolDefinition,
    frameToolDefinition,
    mouseToolDefinition,
    downloadToolDefinition,
  ];

  console.error(`  ✓ ${snapshotTool.name} (THE CORE TOOL FOR TOKEN OPTIMIZATION)`);
  console.error(`  ✓ ${navigateToolDefinition.name}`);
  console.error(`  ✓ ${fillToolDefinition.name}`);
  console.error(`  ✓ ${typeToolDefinition.name}`);
  console.error(`  ✓ ${clickTool.name}`);
  console.error(`  ✓ ${hoverTool.name}`);
  console.error(`  ✓ ${scrollTool.name}`);
  console.error(`  ✓ ${pressTool.name}`);
  console.error(`  ✓ ${selectToolDefinition.name}`);
  console.error(`  ✓ ${checkToolDefinition.name}`);
  console.error(`  ✓ ${uncheckToolDefinition.name}`);
  console.error(`  ✓ ${dragToolDefinition.name}`);
  console.error(`  ✓ ${uploadToolDefinition.name}`);
  console.error(`  ✓ ${dblclickToolDefinition.name}`);
  console.error(`  ✓ ${focusToolDefinition.name}`);
  console.error(`  ✓ ${screenshotToolDefinition.name}`);
  console.error(`  ✓ ${closeToolDefinition.name}`);
  console.error(`  ✓ ${backToolDefinition.name}`);
  console.error(`  ✓ ${forwardToolDefinition.name}`);
  console.error(`  ✓ ${reloadToolDefinition.name}`);
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
  console.error(`  ✓ ${highlightToolDefinition.name}`);
  console.error(`  ✓ ${profilerToolDefinition.name}`);
  console.error(`  ✓ ${diffToolDefinition.name}`);
  console.error(`  ✓ ${dialogToolDefinition.name}`);
  console.error(`  ✓ ${frameToolDefinition.name}`);
  console.error(`  ✓ ${mouseToolDefinition.name}`);
  console.error(`  ✓ ${downloadToolDefinition.name}`);
  console.error('All tools registered successfully');
}
