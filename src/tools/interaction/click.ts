import { resolveRef } from '../../utils/ref-resolver.js';
import type { BrowserManager } from '../../browser/manager.js';

export const clickTool = {
  name: 'browser_click',
  description: `
Click an element using a ref from browser_snapshot.

TOKEN-EFFICIENT: Use @ref instead of CSS selectors.
Example: click @e2 (where e2 came from snapshot)

Refs are cached after each snapshot, so subsequent calls
use the same refs without re-querying the DOM.

If the ref is invalid (page changed), you'll get an error
listing available refs. Call browser_snapshot to refresh.

ALTERNATIVE: For semantic locators, use browser_find.
  `.trim(),

  inputSchema: {
    type: 'object' as const,
    properties: {
      ref: {
        type: 'string' as const,
        description: 'Element ref (e.g., "e2" or "@e2")',
        pattern: '^@?e\\d+$',
      },
      button: {
        type: 'string' as const,
        enum: ['left', 'right', 'middle'] as const,
        description: 'Mouse button to click (default: left)',
      },
      clickCount: {
        type: 'number' as const,
        description: 'Number of clicks (1 = single, 2 = double)',
      },
    },
    required: ['ref'],
  },

  async handler(params: any, browserManager: BrowserManager) {
    const page = browserManager.getPage();
    const refMap = browserManager.getRefMap();
    const locator = resolveRef(page, params.ref, refMap);

    await locator.click({
      button: (params.button as any) || 'left',
      clickCount: params.clickCount || 1,
    });

    return {
      content: [
        {
          type: 'text',
          text: `Clicked element ${params.ref}`,
        },
      ],
    };
  },
};
