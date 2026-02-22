import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Uncheck a checkbox element using a ref
 */
export async function uncheckTool(
  browserManager: BrowserManager,
  args: { ref: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  await locator.uncheck();

  return {
    content: [
      {
        type: 'text',
        text: `Unchecked element ${args.ref}`,
      },
    ],
  };
}

/**
 * Uncheck tool definition
 */
export const uncheckToolDefinition: Tool = {
  name: 'browser_uncheck',
  description: `
Uncheck a checkbox using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

This is the opposite of browser_check.

Note: Radio buttons cannot be unchecked - use browser_check
on a different radio button in the group instead.

Example: Uncheck checkbox at element e1

If the element is already unchecked, this operation has no effect.
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
