import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Fill an input element using a ref
 */
export async function fillTool(
  browserManager: BrowserManager,
  args: { ref: string; value: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  await locator.fill(args.value);

  return {
    content: [
      {
        type: 'text',
        text: `Filled ${args.ref} with: ${args.value}`,
      },
    ],
  };
}

/**
 * Fill tool definition
 */
export const fillToolDefinition = {
  name: 'browser_fill',
  description:
    'Fill an input, textarea, or contenteditable element with text using a ref. Supports refs from browser_snapshot (e.g., "e1", "@e1").',
  inputSchema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Element reference (e.g., "e1", "@e1")',
      },
      value: {
        type: 'string',
        description: 'Text to fill into the element',
      },
    },
    required: ['ref', 'value'],
  },
};
