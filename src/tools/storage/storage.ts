import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * Storage management tool for localStorage and sessionStorage
 *
 * Reference agent-browser:
 * - storage local                # Get all localStorage
 * - storage local <key>          # Get specific key
 * - storage local set <k> <v>    # Set value
 * - storage local clear          # Clear all
 * - storage session              # Same for sessionStorage
 */
export const storageTool: Tool = {
  name: 'browser_storage',
  description: `
**Manage localStorage or sessionStorage for the current page.**

Use this tool to get, set, or clear storage in the current page context.

**ACTIONS:**

**get** - Get storage items
  action: "get"
  type: "local" or "session" (required)
  key: Specific key to get (optional, returns all if not specified)

**set** - Set a storage item
  action: "set"
  type: "local" or "session" (required)
  key: Storage key (required)
  value: Storage value (required, will be converted to string)

**clear** - Clear all storage items
  action: "clear"
  type: "local" or "session" (required)

**EXAMPLES:**

Get all localStorage:
  browser_storage with action="get", type="local"

Get specific localStorage key:
  browser_storage with action="get", type="local", key="username"

Set localStorage item:
  browser_storage with action="set", type="local", key="session", value="abc123"

Clear all localStorage:
  browser_storage with action="clear", type="local"

Same operations for sessionStorage:
  browser_storage with action="get", type="session"
  browser_storage with action="set", type="session", key="temp", value="data"

**OUTPUT:**
- get: Object with all key-value pairs, or single value if key specified
- set: Success message
- clear: Success message with count of cleared items
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (get, set, clear)',
        enum: ['get', 'set', 'clear']
      },
      type: {
        type: 'string',
        description: 'Storage type (local for localStorage, session for sessionStorage)',
        enum: ['local', 'session']
      },
      key: {
        type: 'string',
        description: 'Storage key (required for set, optional for get to get specific key)'
      },
      value: {
        type: 'string',
        description: 'Storage value (required for set action, will be converted to string if not)'
      }
    },
    required: ['action', 'type']
  }
};

export async function storageToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const action = params.action as string;
  const type = params.type as string;

  const storageName = type === 'session' ? 'sessionStorage' : 'localStorage';

  switch (action) {
    case 'get': {
      if (params.key) {
        // Get specific key
        const value = await page.evaluate(
          (args) => {
            const { storageName, key } = args as { storageName: string; key: string };
            // @ts-ignore - dynamic access to window storage
            return window[storageName].getItem(key);
          },
          { storageName, key: params.key }
        );

        return {
          content: [{
            type: 'text',
            text: value === null ? 'null' : value
          }]
        };
      } else {
        // Get all items
        const items = await page.evaluate(
          (args) => {
            const { storageName } = args as { storageName: string };
            // @ts-ignore - dynamic access to window storage
            const storage = window[storageName];
            const result: Record<string, string> = {};
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key) {
                result[key] = storage.getItem(key) || '';
              }
            }
            return result;
          },
          { storageName }
        );

        return {
          content: [{
            type: 'text',
            text: JSON.stringify(items, null, 2)
          }]
        };
      }
    }

    case 'set': {
      if (!params.key) {
        throw new Error('key is required for set action');
      }
      if (params.value === undefined || params.value === null) {
        throw new Error('value is required for set action');
      }

      // Convert value to string if it's not already
      const value = String(params.value);

      await page.evaluate(
        (args) => {
          const { storageName, key, value } = args as { storageName: string; key: string; value: string };
          // @ts-ignore - dynamic access to window storage
          window[storageName].setItem(key, value);
        },
        { storageName, key: params.key, value }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Set ${storageName} item "${params.key}"`,
            key: params.key,
            value: value
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      const countBefore = await page.evaluate(
        (args) => {
          const { storageName } = args as { storageName: string };
          // @ts-ignore - dynamic access to window storage
          return window[storageName].length;
        },
        { storageName }
      );

      await page.evaluate(
        (args) => {
          const { storageName } = args as { storageName: string };
          // @ts-ignore - dynamic access to window storage
          window[storageName].clear();
        },
        { storageName }
      );

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Cleared ${countBefore} items from ${storageName}`,
            count: countBefore,
            type: type
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const storageToolDefinition = {
  name: storageTool.name,
  description: storageTool.description,
  inputSchema: storageTool.inputSchema
};
