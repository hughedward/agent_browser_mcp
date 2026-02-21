import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Tab tool handler - manages tabs with multiple actions
 */
export async function tabTool(
  browserManager: BrowserManager,
  args: {
    action: 'list' | 'new' | 'switch' | 'close';
    index?: number;
    url?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    switch (args.action) {
      case 'list': {
        const tabs = await browserManager.listTabs();
        const activeIndex = browserManager.getActiveIndex();

        let output = `Tabs (${tabs.length} total, current tab: ${activeIndex}):\n\n`;

        for (const tab of tabs) {
          const marker = tab.active ? '> ' : '  ';
          const title = tab.title || '(no title)';
          const url = tab.url || 'about:blank';
          output += `${marker}[${tab.index}] ${title}\n`;
          output += `    ${url}\n`;
        }

        return {
          content: [
            {
              type: 'text',
              text: output,
            },
          ],
        };
      }

      case 'new': {
        const result = await browserManager.newTab();

        let message = `Created new tab [${result.index}] (${result.total} total tabs)`;

        // If URL provided, navigate to it
        if (args.url) {
          const page = browserManager.getPage();
          await page.goto(args.url, { waitUntil: 'load' });
          message += ` and navigated to: ${args.url}`;
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

      case 'switch': {
        if (args.index === undefined) {
          return {
            content: [
              {
                type: 'text',
                text: 'Error: index is required for switch action',
              },
            ],
            isError: true,
          };
        }

        const result = await browserManager.switchTo(args.index);
        const page = browserManager.getPage();
        const title = await page.title().catch(() => '');

        return {
          content: [
            {
              type: 'text',
              text: `Switched to tab [${result.index}]: ${title}\n    ${result.url}`,
            },
          ],
        };
      }

      case 'close': {
        const result = await browserManager.closeTab(args.index);

        return {
          content: [
            {
              type: 'text',
              text: `Closed tab [${result.closed}], ${result.remaining} tabs remaining`,
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
          text: `Tab operation failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Tab tool definition
 */
export const tabToolDefinition: Tool = {
  name: 'browser_tab',
  description: `
Manage browser tabs with multiple actions.

ACTIONS:
- list: List all tabs with their indices, URLs, and titles. Shows current tab index.
- new: Create a new tab (optionally with URL to navigate to)
- switch: Switch to a specific tab by index
- close: Close current tab or a specific tab by index

EXAMPLES:
- List tabs: {"action": "list"}
- Create new tab: {"action": "new"}
- Create tab with URL: {"action": "new", "url": "https://example.com"}
- Switch to tab: {"action": "switch", "index": 2}
- Close current tab: {"action": "close"}
- Close specific tab: {"action": "close", "index": 1}

NOTES:
- Tab indices are zero-based (0, 1, 2, ...)
- Current tab index is shown in list output
- Cannot close the last tab (use browser_close to close browser)
- After switching tabs, subsequent operations affect the new tab
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform',
        enum: ['list', 'new', 'switch', 'close'],
      },
      index: {
        type: 'number',
        description: 'Tab index (required for switch, optional for close)',
      },
      url: {
        type: 'string',
        description: 'URL to navigate to (optional for new action)',
      },
    },
    required: ['action'],
  },
};
