import { resolveRef } from '../../utils/ref-resolver.js';
import type { BrowserManager } from '../../browser/manager.js';

export const hoverTool = {
  name: 'browser_hover',
  description: `
Hover over an element using a ref from browser_snapshot.

TOKEN-EFFICIENT: Use @ref instead of CSS selectors.
Example: hover @e5 (where e5 came from snapshot)

Useful for:
- Triggering dropdown menus
- Revealing hidden content
- Testing hover states
- Interactive elements that respond to hover

After hovering, use browser_snapshot to see any revealed content.
  `.trim(),

  inputSchema: {
    type: 'object' as const,
    properties: {
      ref: {
        type: 'string' as const,
        description: 'Element ref (e.g., "e5" or "@e5")',
        pattern: '^@?e\\d+$',
      },
    },
    required: ['ref'],
  },

  async handler(params: any, browserManager: BrowserManager) {
    const page = browserManager.getPage();
    const refMap = browserManager.getRefMap();
    const locator = resolveRef(page, params.ref, refMap);

    await locator.hover();

    return {
      content: [
        {
          type: 'text',
          text: `Hovered over element ${params.ref}`,
        },
      ],
    };
  },
};
