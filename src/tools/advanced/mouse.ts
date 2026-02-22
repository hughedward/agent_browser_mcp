import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Precise mouse control via CDP
 */
export async function mouseTool(
  browserManager: BrowserManager,
  args: {
    action: 'move' | 'down' | 'up' | 'wheel';
    x?: number;
    y?: number;
    button?: 'left' | 'right' | 'middle';
    deltaX?: number;
    deltaY?: number;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    if (args.action === 'move') {
      // Move mouse to position
      if (args.x === undefined || args.y === undefined) {
        throw new Error('x and y coordinates are required for move action');
      }

      await browserManager.injectMouseEvent({
        type: 'mouseMoved',
        x: args.x,
        y: args.y,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Moved mouse to (${args.x}, ${args.y})`,
          },
        ],
      };
    } else if (args.action === 'down') {
      // Press mouse button
      const button = args.button || 'left';

      await browserManager.injectMouseEvent({
        type: 'mousePressed',
        x: 0, // Button press doesn't require position, uses current
        y: 0,
        button,
        clickCount: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Pressed ${button} mouse button`,
          },
        ],
      };
    } else if (args.action === 'up') {
      // Release mouse button
      const button = args.button || 'left';

      await browserManager.injectMouseEvent({
        type: 'mouseReleased',
        x: 0, // Button release doesn't require position, uses current
        y: 0,
        button,
        clickCount: 1,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Released ${button} mouse button`,
          },
        ],
      };
    } else if (args.action === 'wheel') {
      // Scroll mouse wheel
      if (args.deltaX === undefined && args.deltaY === undefined) {
        throw new Error('At least one of deltaX or deltaY is required for wheel action');
      }

      await browserManager.injectMouseEvent({
        type: 'mouseWheel',
        x: 0,
        y: 0,
        deltaX: args.deltaX || 0,
        deltaY: args.deltaY || 0,
      });

      return {
        content: [
          {
            type: 'text',
            text: `Scrolled wheel by (deltaX: ${args.deltaX || 0}, deltaY: ${args.deltaY || 0})`,
          },
        ],
      };
    } else {
      throw new Error(`Invalid mouse action: ${args.action}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to perform mouse action: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Mouse tool definition
 */
export const mouseToolDefinition: Tool = {
  name: 'browser_mouse',
  description: `
Precise mouse control for advanced interactions (drag, custom clicks, scrolling).

ACTIONS:
1. move: Move mouse cursor to specific coordinates
   - Requires x, y coordinates

2. down: Press mouse button (for drag operations)
   - button: "left" (default), "right", "middle"

3. up: Release mouse button (completes drag)
   - button: "left" (default), "right", "middle"

4. wheel: Scroll mouse wheel
   - deltaX: Horizontal scroll (positive = right)
   - deltaY: Vertical scroll (positive = away from user)

USAGE:
1. Move mouse:
   { action: "move", x: 100, y: 200 }

2. Press button (start drag):
   { action: "down", button: "left" }

3. Release button (end drag):
   { action: "up", button: "left" }

4. Scroll wheel:
   { action: "wheel", deltaY: 100 }

DRAG OPERATION:
1. Move to start position: { action: "move", x: 100, y: 100 }
2. Press button: { action: "down", button: "left" }
3. Move to end position: { action: "move", x: 200, y: 200 }
4. Release button: { action: "up", button: "left" }

COORDINATES:
- Origin (0, 0) is top-left of viewport
- X increases to the right
- Y increases downward

TYPICAL USE CASES:
- Drag and drop elements
- Custom click interactions
- Precise scrolling control
- Drawing on canvas

NOTE: For most interactions, prefer click/hover tools over mouse control.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        enum: ['move', 'down', 'up', 'wheel'],
        description: 'Mouse action to perform',
      },
      x: {
        type: 'number',
        description: 'X coordinate for move action (0 = left edge)',
      },
      y: {
        type: 'number',
        description: 'Y coordinate for move action (0 = top edge)',
      },
      button: {
        type: 'string',
        enum: ['left', 'right', 'middle'],
        description: 'Mouse button for down/up actions (default: left)',
      },
      deltaX: {
        type: 'number',
        description: 'Horizontal scroll delta for wheel (positive = right)',
      },
      deltaY: {
        type: 'number',
        description: 'Vertical scroll delta for wheel (positive = scroll away/down)',
      },
    },
    required: ['action'],
  },
};
