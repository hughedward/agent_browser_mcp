import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Double click an element using a ref
 */
export async function dblclickTool(
  browserManager: BrowserManager,
  args: { ref: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  await locator.dblclick();

  return {
    content: [
      {
        type: 'text',
        text: `Double clicked element ${args.ref}`,
      },
    ],
  };
}

/**
 * Double click tool definition
 */
export const dblclickToolDefinition: Tool = {
  name: 'browser_dblclick',
  description: `
Double click an element using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

Common use cases:
- Open files or folders
- Select text (word by word)
- Trigger double-click actions
- Activate edit mode

Example: Double click element e1

Alternative: You can also use browser_click with clickCount: 2
to achieve the same effect.

If the ref is invalid (page changed), you'll get an error
listing available refs. Call browser_snapshot to refresh.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Element reference (e.g., "e1", "@e1")',
        pattern: '^@?e\\d+$',
      },
    },
    required: ['ref'],
  },
};
