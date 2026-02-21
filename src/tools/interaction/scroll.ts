import { resolveRef } from '../../utils/ref-resolver.js';
import type { BrowserManager } from '../../browser/manager.js';

export const scrollTool = {
  name: 'browser_scroll',
  description: `
Scroll the page or an element into view.

MODES:
1. Page scroll: Scroll the entire page
   Example: { direction: "down", distance: 500 }

2. Element scroll: Scroll specific element into view
   Example: { ref: "@e10" }

PAGE SCROLL OPTIONS:
- direction: "up", "down", "left", "right" (default: "down")
- distance: Number of pixels to scroll (default: 500)
- unit: "px" (pixels) or "viewport" (percent of viewport height, default: "px")

ELEMENT SCROLL OPTIONS:
- ref: Element ref (e.g., "@e10")
- block: "start", "center", "end", "nearest" (default: "center")
  Where to align the element in viewport

TOKEN-EFFICIENT: Use @ref for element scroll instead of CSS selectors.
  `.trim(),

  inputSchema: {
    type: 'object' as const,
    properties: {
      // Page scroll options
      direction: {
        type: 'string' as const,
        enum: ['up', 'down', 'left', 'right'] as const,
        description: 'Scroll direction (for page scroll)',
      },
      distance: {
        type: 'number' as const,
        description: 'Distance to scroll in pixels (for page scroll, default: 500)',
      },
      unit: {
        type: 'string' as const,
        enum: ['px', 'viewport'] as const,
        description: 'Unit for distance (default: "px")',
      },

      // Element scroll options
      ref: {
        type: 'string' as const,
        description: 'Element ref to scroll into view (e.g., "e10" or "@e10")',
        pattern: '^@?e\\d+$',
      },
      block: {
        type: 'string' as const,
        enum: ['start', 'center', 'end', 'nearest'] as const,
        description: 'Vertical alignment for element scroll (default: "center")',
      },
    },
  },

  async handler(params: any, browserManager: BrowserManager) {
    const page = browserManager.getPage();

    // Element scroll mode
    if (params.ref) {
      const refMap = browserManager.getRefMap();
      const locator = resolveRef(page, params.ref, refMap);

      await locator.scrollIntoViewIfNeeded(params.block || 'center');

      return {
        content: [
          {
            type: 'text',
            text: `Scrolled element ${params.ref} into view (block: ${params.block || 'center'})`,
          },
        ],
      };
    }

    // Page scroll mode
    const direction = params.direction || 'down';
    const distance = params.distance || 500;
    const unit = params.unit || 'px';

    // Calculate actual pixels
    const pixels = unit === 'viewport'
      ? distance * (await page.viewportSize()?.height || 800) / 100
      : distance;

    // Get current scroll position
    const scrollPosition = await page.evaluate(() => ({
      x: window.scrollX,
      y: window.scrollY,
    }));

    let newScrollX = scrollPosition.x;
    let newScrollY = scrollPosition.y;

    switch (direction) {
      case 'up':
        newScrollY -= pixels;
        break;
      case 'down':
        newScrollY += pixels;
        break;
      case 'left':
        newScrollX -= pixels;
        break;
      case 'right':
        newScrollX += pixels;
        break;
    }

    // Ensure non-negative
    newScrollX = Math.max(0, newScrollX);
    newScrollY = Math.max(0, newScrollY);

    await page.evaluate(
      ({ x, y }) => {
        window.scrollTo(x, y);
      },
      { x: newScrollX, y: newScrollY }
    );

    return {
      content: [
        {
          type: 'text',
          text: `Scrolled ${direction} by ${pixels}px (to ${newScrollX}, ${newScrollY})`,
        },
      ],
    };
  },
};
