import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Switch to an iframe by selector, name, or URL, or switch back to main frame
 */
export async function frameTool(
  browserManager: BrowserManager,
  args: {
    action: 'switch' | 'main';
    selector?: string;
    name?: string;
    url?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    if (args.action === 'main') {
      // Switch back to main frame
      browserManager.switchToMainFrame();

      return {
        content: [
          {
            type: 'text',
            text: 'Switched back to main frame',
          },
        ],
      };
    } else if (args.action === 'switch') {
      // Switch to iframe by selector, name, or URL
      if (!args.selector && !args.name && !args.url) {
        throw new Error('Either selector, name, or url is required to switch to a frame');
      }

      await browserManager.switchToFrame({
        selector: args.selector,
        name: args.name,
        url: args.url,
      });

      const identifier = args.selector || args.name || args.url || '';
      return {
        content: [
          {
            type: 'text',
            text: `Switched to iframe: ${identifier}`,
          },
        ],
      };
    } else {
      throw new Error(`Invalid frame action: ${args.action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to switch frame: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Frame tool definition
 */
export const frameToolDefinition: Tool = {
  name: 'browser_frame',
  description: `
Switch between iframes and the main frame for interacting with embedded content.

ACTIONS:
1. switch: Switch to an iframe by selector, name, or URL
   - selector: CSS selector (e.g., "#myframe", "iframe[name='frame1']")
   - name: Frame name attribute (e.g., "myframe")
   - url: Frame URL (partial match)

2. main: Switch back to the main document frame

USAGE:
1. Switch by selector (most common):
   { action: "switch", selector: "#myframe" }
   { action: "switch", selector: "iframe[src*='embed']" }

2. Switch by frame name:
   { action: "switch", name: "contentframe" }

3. Switch by URL:
   { action: "switch", url: "https://example.com/embed" }

4. Return to main frame:
   { action: "main" }

WORKFLOW:
1. Navigate to page with iframes
2. Use snapshot to see available iframes
3. Switch to iframe using selector/name/url
4. Interact with elements inside iframe
5. Switch back to main when done

EXAMPLE:
1. Take snapshot to see iframe
2. { action: "switch", selector: "#editor-frame" }
3. Click/type inside iframe
4. { action: "main" } to return

NOTE: All actions after switching target the active frame.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['switch', 'main'],
        description: 'Action to perform',
      },
      selector: {
        type: 'string',
        description: 'CSS selector for the iframe element (e.g., "#myframe", "iframe:nth-child(1)")',
      },
      name: {
        type: 'string',
        description: 'Frame name attribute value',
      },
      url: {
        type: 'string',
        description: 'Frame URL (partial match)',
      },
    },
    required: ['action'],
  },
};
