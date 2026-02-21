import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Type text into an element without clearing existing content
 */
export async function typeTool(
  browserManager: BrowserManager,
  args: { ref: string; text: string; delay?: number }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  // Type with optional delay between keystrokes
  await locator.type(args.text, { delay: args.delay || 0 });

  return {
    content: [
      {
        type: 'text',
        text: `Typed "${args.text}" into ${args.ref}`,
      },
    ],
  };
}

/**
 * Type tool definition
 */
export const typeToolDefinition: Tool = {
  name: 'browser_type',
  description:
    'Type text into an element without clearing existing content. Unlike fill, this appends text. Supports refs from browser_snapshot (e.g., "e1", "@e1").',
  inputSchema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Element reference (e.g., "e1", "@e1")',
      },
      text: {
        type: 'string',
        description: 'Text to type into the element',
      },
      delay: {
        type: 'number',
        description: 'Delay in milliseconds between keystrokes (default: 0)',
      },
    },
    required: ['ref', 'text'],
  },
};
