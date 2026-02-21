import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Close the current page/tab
 */
export async function closeTool(
  browserManager: BrowserManager
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();
    await page.close();

    return {
      content: [
        {
          type: 'text',
          text: 'Closed current page/tab',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to close page: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Close tool definition
 */
export const closeToolDefinition: Tool = {
  name: 'browser_close',
  description: `
Close the current page/tab.

USE CASES:
- Closing popups or dialogs
- Cleaning up after navigation
- Ending a browsing session

NOTE: After closing, you'll need to create a new page
or navigate to continue browsing.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {},
  },
};
