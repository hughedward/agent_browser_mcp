import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Check a checkbox or radio button element using a ref
 */
export async function checkTool(
  browserManager: BrowserManager,
  args: { ref: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  await locator.check();

  return {
    content: [
      {
        type: 'text',
        text: `Checked element ${args.ref}`,
      },
    ],
  };
}

/**
 * Check tool definition
 */
export const checkToolDefinition: Tool = {
  name: 'browser_check',
  description: `
Check a checkbox or radio button using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

This is the opposite of browser_uncheck.

Example: Check checkbox at element e1

If the element is already checked, this operation has no effect.
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
