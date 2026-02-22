import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Navigate forward in browser history
 */
export async function forwardTool(
  browserManager: BrowserManager
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();
    await page.goForward();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigated forward in history',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to navigate forward: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Forward tool definition
 */
export const forwardToolDefinition: Tool = {
  name: 'browser_forward',
  description: `
Navigate forward in browser history.

USE CASES:
- Moving forward after going back
- Returning to a page you navigated away from
- Re-navigating to previously visited pages

NOTE: This only works if you've gone back and have forward history.
If there's no forward history, the tool will return an error.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {},
  },
};
