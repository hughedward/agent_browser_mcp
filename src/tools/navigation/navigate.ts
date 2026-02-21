import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Navigate to a URL
 * Invalidates refs on navigation since the page structure changes
 */
export async function navigateTool(
  browserManager: BrowserManager,
  args: { url: string; waitUntil?: 'load' | 'domcontentloaded' | 'networkidle' | 'commit'; headers?: Record<string, string> }
): Promise<{ content: Array<{ type: string; text: string }>; isError?: boolean }> {
  const page = browserManager.getPage();

  try {
    if (args.headers) {
      await page.setExtraHTTPHeaders(args.headers);
      await page.goto(args.url, { waitUntil: args.waitUntil || 'load' });
      await page.setExtraHTTPHeaders({}); // Clear headers after navigation
    } else {
      await page.goto(args.url, { waitUntil: args.waitUntil || 'load' });
    }

    // Refs are automatically invalidated on navigation - the next snapshot will generate new refs
    // The refMap is cleared when a new snapshot is taken

    return {
      content: [
        {
          type: 'text',
          text: `Navigated to: ${args.url}`,
        },
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to navigate to ${args.url}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Navigate tool definition
 */
export const navigateToolDefinition: Tool = {
  name: 'browser_navigate',
  description: 'Navigate to a URL. Invalidates refs on navigation since the page structure changes.',
  inputSchema: {
    type: 'object',
    properties: {
      url: {
        type: 'string',
        description: 'URL to navigate to',
      },
      waitUntil: {
        type: 'string',
        description: 'Navigation wait condition',
        enum: ['load', 'domcontentloaded', 'networkidle', 'commit'],
      },
      headers: {
        type: 'object',
        description: 'Optional headers to apply for this navigation only',
        additionalProperties: { type: 'string' },
      },
    },
    required: ['url'],
  },
};
