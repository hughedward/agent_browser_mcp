import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Select option(s) in a dropdown element using a ref
 */
export async function selectTool(
  browserManager: BrowserManager,
  args: { ref: string; values: string[] }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  // Select options in the dropdown
  await locator.selectOption(args.values);

  return {
    content: [
      {
        type: 'text',
        text: `Selected ${args.values.length} option(s) in ${args.ref}: ${args.values.join(', ')}`,
      },
    ],
  };
}

/**
 * Select tool definition
 */
export const selectToolDefinition: Tool = {
  name: 'browser_select',
  description: `
Select one or more options in a dropdown (select) element using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

For single-select dropdowns, provide one value.
For multi-select dropdowns, provide multiple values.

Example: Select option "option1" in element e1
  values: ["option1"]

Example: Select multiple options in a multi-select dropdown
  values: ["option1", "option2", "option3"]

The values should match the option values (not the display text).
Use browser_snapshot with verbose mode to see option values.

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
      values: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of option values to select. For single-select, use one value. For multi-select, use multiple values.',
        minItems: 1,
      },
    },
    required: ['ref', 'values'],
  },
};
