import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Take a screenshot of the current page or a specific element
 */
export async function screenshotTool(
  browserManager: BrowserManager,
  args: {
    ref?: string;
    type?: 'png' | 'jpeg';
    quality?: number;
    fullPage?: boolean;
  }
): Promise<{
  content: Array<{ type: string; data?: string; mimeType?: string; text?: string }>;
  isError?: boolean;
}> {
  const page = browserManager.getPage();

  try {
    let screenshot: Buffer;

    if (args.ref) {
      // Screenshot specific element using ref
      const refMap = browserManager.getRefMap();
      const refKey = args.ref.replace('@', '');
      const refData = refMap[refKey];

      if (!refData) {
        throw new Error(`Invalid ref: ${args.ref}. Available refs: ${Object.keys(refMap).join(', ')}`);
      }

      const locator = page.locator(`css=${refData.selector}`);
      screenshot = await locator.screenshot({
        type: args.type || 'png',
        quality: args.quality,
      });
    } else {
      // Screenshot full page or viewport
      screenshot = await page.screenshot({
        type: args.type || 'png',
        quality: args.quality,
        fullPage: args.fullPage || false,
      });
    }

    // Convert to base64
    const base64 = screenshot.toString('base64');
    const mimeType = args.type === 'jpeg' ? 'image/jpeg' : 'image/png';

    const description = args.ref
      ? `Screenshot of element ${args.ref}`
      : args.fullPage
      ? 'Full page screenshot'
      : 'Viewport screenshot';

    return {
      content: [
        {
          type: 'image',
          data: base64,
          mimeType,
        },
        {
          type: 'text',
          text: description,
        } as any,
      ],
    };
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to take screenshot: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Screenshot tool definition
 */
export const screenshotToolDefinition: Tool = {
  name: 'browser_screenshot',
  description: `
Take a screenshot of the current page or a specific element.

RETURNS: Base64-encoded image data that can be displayed directly

MODES:
1. Viewport screenshot (default): Captures visible viewport
   Example: {}

2. Full page screenshot: Captures entire scrollable page
   Example: { fullPage: true }

3. Element screenshot: Captures specific element by ref
   Example: { ref: "@e10" }

OPTIONS:
- type: "png" (default) or "jpeg"
- quality: 1-100 (only for JPEG)
- fullPage: true to capture entire page (default: false)
- ref: Element ref to screenshot specific element

TOKEN-EFFICIENT: Use @ref for element screenshots.

OUTPUT FORMAT:
{
  content: [
    { type: "image", data: "<base64>", mimeType: "image/png" },
    { type: "text", text: "Screenshot description" }
  ]
}
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Element ref to screenshot (e.g., "e10" or "@e10"). If not provided, captures viewport.',
        pattern: '^@?e\\d+$',
      },
      type: {
        type: 'string',
        enum: ['png', 'jpeg'],
        description: 'Image format (default: png)',
      },
      quality: {
        type: 'number',
        description: 'Image quality 1-100 (only for JPEG)',
        minimum: 1,
        maximum: 100,
      },
      fullPage: {
        type: 'boolean',
        description: 'Capture full scrollable page (default: false)',
      },
    },
  },
};
