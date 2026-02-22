import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Drag and drop from one element to another using refs
 */
export async function dragTool(
  browserManager: BrowserManager,
  args: { fromRef: string; toRef: string }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const fromLocator = resolveRef(page, args.fromRef, refMap);
  const toLocator = resolveRef(page, args.toRef, refMap);

  await fromLocator.dragTo(toLocator);

  return {
    content: [
      {
        type: 'text',
        text: `Dragged from ${args.fromRef} to ${args.toRef}`,
      },
    ],
  };
}

/**
 * Drag tool definition
 */
export const dragToolDefinition: Tool = {
  name: 'browser_drag',
  description: `
Drag and drop from one element to another using refs.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

Common use cases:
- Drag and drop items in a list
- Drag files to upload zones
- Drag elements in a canvas or designer
- Move items between containers

Example: Drag from e1 to e2
  fromRef: "e1"
  toRef: "e2"

If either ref is invalid (page changed), you'll get an error
listing available refs. Call browser_snapshot to refresh.

Note: This performs a full drag-and-drop operation including
mouse down, drag, and mouse up events.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      fromRef: {
        type: 'string',
        description: 'Source element reference to drag from (e.g., "e1", "@e1")',
        pattern: '^@?e\\d+$',
      },
      toRef: {
        type: 'string',
        description: 'Target element reference to drop on (e.g., "e2", "@e2")',
        pattern: '^@?e\\d+$',
      },
    },
    required: ['fromRef', 'toRef'],
  },
};
