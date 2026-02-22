import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Navigate back in browser history
 */
export async function backTool(
  browserManager: BrowserManager
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();
    await page.goBack();

    return {
      content: [
        {
          type: 'text',
          text: 'Navigated back in history',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to navigate back: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Back tool definition
 */
export const backToolDefinition: Tool = {
  name: 'browser_back',
  description: `
Navigate back in browser history.

USE CASES:
- Returning to the previous page
- Going back after following a link
- Reverting navigation actions

NOTE: This only works if there's history to go back to.
If there's no history, the tool will return an error.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {},
  },
};
