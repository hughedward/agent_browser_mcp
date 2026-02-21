import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * Console messages viewer tool
 *
 * Reference agent-browser:
 * - console                    # View console messages
 * - console --clear            # Clear console messages
 */
export const consoleTool: Tool = {
  name: 'browser_console',
  description: `
**View and clear browser console messages for debugging.**

Use this tool to inspect console.log, console.error, console.warn, and console.info output from the page.

**ACTIONS:**

**view** - View console messages
  action: "view"
  filter: Optional filter string to match messages (optional)
  types: Array of message types to include (optional, default: all types)
  clear: Set to true to clear messages after viewing (optional)

  Supported types: "log", "error", "warn", "info", "debug", "dir", "dirxml", "table", "trace", "clear", "startGroup", "startGroupCollapsed", "endGroup", "assert", "profile", "profileEnd", "count", "countReset"

**clear** - Clear all console messages
  action: "clear"

**EXAMPLES:**

View all console messages:
  browser_console with action="view"

View only error and warn messages:
  browser_console with action="view", types=["error", "warn"]

View messages containing "API":
  browser_console with action="view", filter="API"

View and clear messages:
  browser_console with action="view", clear=true

Clear all messages:
  browser_console with action="clear"

**OUTPUT:**
- view: Array of console messages with type, text, and timestamp
- clear: Success message with count of cleared messages

**NOTES:**
- Console tracking starts automatically when browser is launched
- Messages are accumulated until manually cleared
- Timestamps are in ISO 8601 format
- filter performs case-insensitive substring matching on message text
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (view, clear)',
        enum: ['view', 'clear']
      },
      filter: {
        type: 'string',
        description: 'Filter string to match message text (case-insensitive, only for view action)'
      },
      types: {
        type: 'array',
        description: 'Array of message types to include (only for view action)',
        items: {
          type: 'string',
          enum: ['log', 'error', 'warn', 'info', 'debug', 'dir', 'dirxml', 'table', 'trace', 'clear', 'startGroup', 'startGroupCollapsed', 'endGroup', 'assert', 'profile', 'profileEnd', 'count', 'countReset']
        }
      },
      clear: {
        type: 'boolean',
        description: 'Clear messages after viewing (only for view action)'
      }
    },
    required: ['action']
  }
};

export async function consoleToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'view': {
      const filter = params.filter as string | undefined;
      const types = params.types as string[] | undefined;
      const clearAfter = params.clear as boolean | undefined;

      // Get console messages using BrowserManager's existing method
      const messages = browserManager.getConsoleMessages();

      // Apply filters
      let filtered = messages;

      if (types && types.length > 0) {
        filtered = filtered.filter(msg => types.includes(msg.type));
      }

      if (filter) {
        const lowerFilter = filter.toLowerCase();
        filtered = filtered.filter(msg => msg.text.toLowerCase().includes(lowerFilter));
      }

      // Clear if requested
      if (clearAfter) {
        browserManager.clearConsoleMessages();
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: filtered.length,
            total: messages.length,
            filter: filter || 'none',
            types: types || 'all',
            cleared: clearAfter || false,
            messages: filtered.map(msg => ({
              type: msg.type,
              text: msg.text,
              timestamp: new Date(msg.timestamp).toISOString()
            }))
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      // Get current count before clearing
      const messages = browserManager.getConsoleMessages();
      const count = messages.length;

      // Clear using BrowserManager's existing method
      browserManager.clearConsoleMessages();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Cleared ${count} console message${count === 1 ? '' : 's'}`,
            count: count
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const consoleToolDefinition = {
  name: consoleTool.name,
  description: consoleTool.description,
  inputSchema: consoleTool.inputSchema
};
