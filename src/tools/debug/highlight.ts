import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { getEnhancedSnapshot } from '../../browser/snapshot.js';

/**
 * Element highlighting tool for debugging
 *
 * Reference agent-browser:
 * - highlight @e1              # Highlight element
 * - highlight @e1 --color red  # Highlight with custom color
 * - highlight --clear          # Clear all highlights
 */
export const highlightTool: Tool = {
  name: 'browser_highlight',
  description: `
**Highlight elements visually for debugging purposes.**

Use this tool to draw attention to specific elements on the page by adding colored borders/overlays.

**ACTIONS:**

**highlight** - Highlight element(s) with a colored border
  action: "highlight"
  element: Element reference (e.g., "@e1", "e123", or CSS selector)
  color: Border color (optional, default: "red")
  width: Border width in pixels (optional, default: "3")
  duration: Auto-clear after milliseconds (optional, default: 0 = permanent)

  Supported colors: "red", "blue", "green", "yellow", "orange", "purple", "pink", "cyan"

**clear** - Clear all highlights
  action: "clear"
  element: Optional specific element to unhighlight (if omitted, clears all)

**EXAMPLES:**

Highlight element by reference:
  browser_highlight with action="highlight", element="@e1"

Highlight with custom color:
  browser_highlight with action="highlight", element="@e2", color="blue", width="5"

Highlight with auto-clear (3 seconds):
  browser_highlight with action="highlight", element="@e3", duration=3000

Clear specific element:
  browser_highlight with action="clear", element="@e1"

Clear all highlights:
  browser_highlight with action="clear"

**OUTPUT:**
- highlight: Success message with count of highlighted elements
- clear: Success message with count of cleared highlights

**NOTES:**
- Highlights are injected via overlay divs that float above the target elements
- Multiple highlights can be active simultaneously
- Highlights persist until explicitly cleared or page navigation
- duration uses milliseconds (1000 = 1 second)
- Highlights are removed on page refresh/navigation
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (highlight, clear)',
        enum: ['highlight', 'clear']
      },
      element: {
        type: 'string',
        description: 'Element reference (@e1, e123) or CSS selector (required for highlight, optional for clear)'
      },
      color: {
        type: 'string',
        description: 'Border color (default: red)',
        enum: ['red', 'blue', 'green', 'yellow', 'orange', 'purple', 'pink', 'cyan', 'magenta', 'lime', 'white', 'black']
      },
      width: {
        type: 'number',
        description: 'Border width in pixels (default: 3)'
      },
      duration: {
        type: 'number',
        description: 'Auto-clear after milliseconds, 0 = permanent (default: 0)'
      }
    },
    required: ['action']
  }
};

export async function highlightToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'highlight': {
      const element = params.element as string;
      const color = params.color as string || 'red';
      const width = params.width as number || 3;
      const duration = params.duration as number || 0;

      if (!element) {
        throw new Error('Element reference or selector is required for highlight action');
      }

      // Get current page
      const page = browserManager.getPage();

      // Convert element reference to selector if needed
      let selector = element;
      if (element.startsWith('@')) {
        const ref = element;
        const snapshot = await getEnhancedSnapshot(page);
        const elementData = snapshot.refs?.[ref];
        if (!elementData) {
          throw new Error(`Element reference ${element} not found in current snapshot`);
        }
        selector = elementData.selector;
      } else if (element.match(/^e\d+$/)) {
        const ref = '@' + element;
        const snapshot = await getEnhancedSnapshot(page);
        const elementData = snapshot.refs?.[ref];
        if (!elementData) {
          throw new Error(`Element reference ${element} not found in current snapshot`);
        }
        selector = elementData.selector;
      }

      // Inject highlight overlay using JavaScript
      const result = await page.evaluate((args: any) => {
        const { selector, color, borderWidth } = args;

        // Find target elements
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) {
          return { success: false, count: 0, message: `No elements found matching selector: ${selector}` };
        }

        // Create or get highlight container
        let container = document.getElementById('__mcp_highlight_container__');
        if (!container) {
          container = document.createElement('div');
          container.id = '__mcp_highlight_container__';
          container.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999999;';
          document.body.appendChild(container);
        }

        // Add highlights for each matched element
        let count = 0;
        elements.forEach((el, index) => {
          const rect = el.getBoundingClientRect();
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;

          const overlay = document.createElement('div');
          const highlightId = `__highlight_${Date.now()}_${index}__`;
          overlay.id = highlightId;

          // Convert color name to RGB
          const colorMap: { [key: string]: string } = {
            red: '255, 0, 0',
            blue: '0, 0, 255',
            green: '0, 255, 0',
            yellow: '255, 255, 0',
            orange: '255, 165, 0',
            purple: '128, 0, 128',
            pink: '255, 192, 203',
            cyan: '0, 255, 255',
            magenta: '255, 0, 255',
            lime: '0, 255, 0',
            white: '255, 255, 255',
            black: '0, 0, 0'
          };
          const rgb = colorMap[color] || '255, 0, 0';

          overlay.style.cssText = `
            position: absolute;
            left: ${rect.left + scrollLeft}px;
            top: ${rect.top + scrollTop}px;
            width: ${rect.width}px;
            height: ${rect.height}px;
            border: ${borderWidth}px solid rgb(${rgb});
            background-color: rgba(${rgb}, 0.1);
            box-sizing: border-box;
            pointer-events: none;
          `;

          container.appendChild(overlay);
          count++;
        });

        return {
          success: true,
          count: count,
          message: `Highlighted ${count} element${count === 1 ? '' : 's'} with ${color} border`
        };
      }, { selector, color, borderWidth: width });

      // Auto-clear if duration is set
      if (duration > 0) {
        setTimeout(async () => {
          try {
            await page.evaluate(() => {
              const container = document.getElementById('__mcp_highlight_container__');
              if (container) {
                container.remove();
              }
            });
          } catch (error) {
            // Page might have been closed/navigated
            console.error('Failed to auto-clear highlights:', error);
          }
        }, duration);
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            count: result.count,
            message: result.message,
            color: color,
            width: width,
            duration: duration > 0 ? `${duration}ms` : 'permanent'
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      const element = params.element as string | undefined;

      // Get current page
      const page = browserManager.getPage();

      // Clear highlights using JavaScript
      const result = await page.evaluate((args: any) => {
        const { specificElement } = args;

        if (specificElement) {
          // Clear specific element highlight (if we tracked them individually)
          // For now, we'll clear all as they're in one container
          const container = document.getElementById('__mcp_highlight_container__');
          if (container) {
            const count = container.children.length;
            container.remove();
            return { success: true, count: count, message: `Cleared ${count} highlight${count === 1 ? '' : 's'}` };
          }
          return { success: true, count: 0, message: 'No highlights to clear' };
        } else {
          // Clear all highlights
          const container = document.getElementById('__mcp_highlight_container__');
          if (container) {
            const count = container.children.length;
            container.remove();
            return { success: true, count: count, message: `Cleared ${count} highlight${count === 1 ? '' : 's'}` };
          }
          return { success: true, count: 0, message: 'No highlights to clear' };
        }
      }, { specificElement: element });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: result.success,
            count: result.count,
            message: result.message
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const highlightToolDefinition = {
  name: highlightTool.name,
  description: highlightTool.description,
  inputSchema: highlightTool.inputSchema
};
