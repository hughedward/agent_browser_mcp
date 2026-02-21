import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Window tool handler - creates new browser windows
 */
export async function windowTool(
  browserManager: BrowserManager,
  args: {
    action: 'new';
    viewport?: { width: number; height: number };
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    switch (args.action) {
      case 'new': {
        const viewport = args.viewport;
        const result = await browserManager.newWindow(viewport);

        let message = `Created new window (tab [${result.index}], ${result.total} total tabs)`;
        if (viewport) {
          message += ` with viewport ${viewport.width}x${viewport.height}`;
        }

        return {
          content: [
            {
              type: 'text',
              text: message,
            },
          ],
        };
      }

      default:
        return {
          content: [
            {
              type: 'text',
              text: `Unknown action: ${args.action}`,
            },
          ],
          isError: true,
        };
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Window operation failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Window tool definition
 */
export const windowToolDefinition: Tool = {
  name: 'browser_window',
  description: `
Create new browser windows with isolated contexts.

ACTIONS:
- new: Create a new browser window (separate context from current window)

EXAMPLES:
- Create new window: {"action": "new"}
- Create window with custom viewport: {"action": "new", "viewport": {"width": 1920, "height": 1080}}

NOTES:
- Each window has its own isolated browser context (separate cookies, storage, etc.)
- Windows share the same browser instance
- After creating a window, it becomes the active tab for subsequent operations
- Use browser_tab to list all tabs/windows and switch between them
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform',
        enum: ['new'],
      },
      viewport: {
        type: 'object',
        description: 'Viewport size for the new window',
        properties: {
          width: {
            type: 'number',
            description: 'Viewport width in pixels',
          },
          height: {
            type: 'number',
            description: 'Viewport height in pixels',
          },
        },
        required: ['width', 'height'],
      },
    },
    required: ['action'],
  },
};
