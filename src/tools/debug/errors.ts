import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * Page errors viewer tool
 *
 * Reference agent-browser:
 * - errors                    # View page errors
 * - errors --clear            # Clear errors
 */
export const errorsTool: Tool = {
  name: 'browser_errors',
  description: `
**View and clear JavaScript errors from the page for debugging.**

Use this tool to inspect uncaught JavaScript errors, runtime errors, and exceptions.

**ACTIONS:**

**view** - View page errors
  action: "view"
  filter: Optional filter string to match error messages (optional)
  clear: Set to true to clear errors after viewing (optional)

**clear** - Clear all errors
  action: "clear"

**EXAMPLES:**

View all page errors:
  browser_errors with action="view"

View errors containing "undefined":
  browser_errors with action="view", filter="undefined"

View and clear errors:
  browser_errors with action="view", clear=true

Clear all errors:
  browser_errors with action="clear"

**OUTPUT:**
- view: Array of error messages with message text and timestamp
- clear: Success message with count of cleared errors

**NOTES:**
- Error tracking starts automatically when browser is launched
- Errors are accumulated until manually cleared
- Timestamps are in ISO 8601 format
- filter performs case-insensitive substring matching on error messages
- Only captures uncaught errors and runtime exceptions
- Does not capture errors handled by try-catch blocks
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
        description: 'Filter string to match error messages (case-insensitive, only for view action)'
      },
      clear: {
        type: 'boolean',
        description: 'Clear errors after viewing (only for view action)'
      }
    },
    required: ['action']
  }
};

export async function errorsToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'view': {
      const filter = params.filter as string | undefined;
      const clearAfter = params.clear as boolean | undefined;

      // Get page errors using BrowserManager's existing method
      const errors = browserManager.getPageErrors();

      // Apply filter
      let filtered = errors;

      if (filter) {
        const lowerFilter = filter.toLowerCase();
        filtered = filtered.filter(err => err.message.toLowerCase().includes(lowerFilter));
      }

      // Clear if requested
      if (clearAfter) {
        browserManager.clearPageErrors();
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: filtered.length,
            total: errors.length,
            filter: filter || 'none',
            cleared: clearAfter || false,
            errors: filtered.map(err => ({
              message: err.message,
              timestamp: new Date(err.timestamp).toISOString()
            }))
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      // Get current count before clearing
      const errors = browserManager.getPageErrors();
      const count = errors.length;

      // Clear using BrowserManager's existing method
      browserManager.clearPageErrors();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Cleared ${count} error${count === 1 ? '' : 's'}`,
            count: count
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const errorsToolDefinition = {
  name: errorsTool.name,
  description: errorsTool.description,
  inputSchema: errorsTool.inputSchema
};
