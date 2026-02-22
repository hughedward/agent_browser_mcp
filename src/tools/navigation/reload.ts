import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Reload the current page
 */
export async function reloadTool(
  browserManager: BrowserManager,
  args?: { waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit' }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();
    await page.reload({ waitUntil: args?.waitUntil || 'load' });

    return {
      content: [
        {
          type: 'text',
          text: 'Page reloaded successfully',
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to reload page: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Reload tool definition
 */
export const reloadToolDefinition: Tool = {
  name: 'browser_reload',
  description: `
Reload the current page.

USE CASES:
- Refreshing dynamic content
- Recovering from errors
- Getting the latest version of a page
- Retrying failed requests

NOTE: Reloading will invalidate all refs from the previous snapshot.
You'll need to take a new snapshot after reloading to get updated refs.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      waitUntil: {
        type: 'string',
        description: 'Reload wait condition',
        enum: ['load', 'domcontentloaded', 'networkidle', 'commit'],
      },
    },
  },
};
