import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Focus an element using a ref
 */
export async function focusTool(
  browserManager: BrowserManager,
  args: { ref: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  await locator.focus();

  return {
    content: [
      {
        type: 'text',
        text: `Focused element ${args.ref}`,
      },
    ],
  };
}

/**
 * Focus tool definition
 */
export const focusToolDefinition: Tool = {
  name: 'browser_focus',
  description: `
Focus an element using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

Common use cases:
- Focus an input field before typing
- Bring an element into view
- Trigger focus-related events
- Prepare element for keyboard input

Example: Focus input element e1

Focusing is often automatically done by other tools like
browser_fill and browser_type, but you can use this tool
explicitly if needed.

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
