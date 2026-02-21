import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

/**
 * Wait for various conditions
 */
export async function waitTool(
  browserManager: BrowserManager,
  args: {
    mode?: 'ref' | 'timeout' | 'text' | 'url' | 'loadState' | 'fn';
    ref?: string;
    timeout?: number;
    text?: string;
    url?: string;
    state?: 'load' | 'domcontentloaded' | 'networkidle';
    fn?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  const page = browserManager.getPage();

  try {
    const mode = args.mode || 'timeout';

    switch (mode) {
      case 'ref': {
        // Wait for element to be visible/attached
        if (!args.ref) {
          throw new Error('ref is required for mode="ref"');
        }

        const refMap = browserManager.getRefMap();
        const refKey = args.ref.replace('@', '');
        const refData = refMap[refKey];

        if (!refData) {
          throw new Error(`Invalid ref: ${args.ref}. Available refs: ${Object.keys(refMap).join(', ')}`);
        }

        const locator = page.locator(`css=${refData.selector}`);
        await locator.waitFor({ state: 'attached', timeout: args.timeout || 30000 });

        return {
          content: [
            {
              type: 'text',
              text: `Element ${args.ref} is now attached`,
            },
          ],
        };
      }

      case 'timeout': {
        // Simple timeout wait
        const duration = args.timeout || 1000;
        await page.waitForTimeout(duration);

        return {
          content: [
            {
              type: 'text',
              text: `Waited ${duration}ms`,
            },
          ],
        };
      }

      case 'text': {
        // Wait for text to appear on page
        if (!args.text) {
          throw new Error('text is required for mode="text"');
        }

        await page.waitForFunction(
          (text: string) => document.body.textContent?.includes(text),
          args.text,
          { timeout: args.timeout || 30000 }
        );

        return {
          content: [
            {
              type: 'text',
              text: `Found text: "${args.text}"`,
            },
          ],
        };
      }

      case 'url': {
        // Wait for URL to match
        if (!args.url) {
          throw new Error('url is required for mode="url"');
        }

        await page.waitForURL(args.url, { timeout: args.timeout || 30000 });

        return {
          content: [
            {
              type: 'text',
              text: `URL matched: ${args.url}`,
            },
          ],
        };
      }

      case 'loadState': {
        // Wait for specific load state
        const state = args.state || 'load';
        await page.waitForLoadState(state, { timeout: args.timeout || 30000 });

        return {
          content: [
            {
              type: 'text',
              text: `Page reached state: ${state}`,
            },
          ],
        };
      }

      case 'fn': {
        // Wait for custom JavaScript function
        if (!args.fn) {
          throw new Error('fn is required for mode="fn"');
        }

        // Poll until the function returns true
        const startTime = Date.now();
        const timeout = args.timeout || 30000;

        while (Date.now() - startTime < timeout) {
          const result = await page.evaluate(
            (fnCode: string) => {
              try {
                return new Function('return ' + fnCode)();
              } catch {
                return false;
              }
            },
            args.fn
          );

          if (result) {
            return {
              content: [
                {
                  type: 'text',
                  text: `Custom function returned true`,
                },
              ],
            };
          }

          // Wait 100ms before polling again
          await page.waitForTimeout(100);
        }

        throw new Error('Custom function did not return true within timeout');
      }

      default:
        throw new Error(`Unknown mode: ${mode}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Wait failed: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Wait tool definition
 */
export const waitToolDefinition: Tool = {
  name: 'browser_wait',
  description: `
Wait for various conditions before proceeding.

MODES:
1. timeout: Wait for specified milliseconds (default)
   Example: { mode: "timeout", timeout: 1000 }

2. ref: Wait for element to be attached
   Example: { mode: "ref", ref: "@e10" }

3. text: Wait for text to appear on page
   Example: { mode: "text", text: "Welcome" }

4. url: Wait for URL to match pattern
   Example: { mode: "url", url: "**/dashboard" }

5. loadState: Wait for page load state
   Example: { mode: "loadState", state: "networkidle" }

6. fn: Wait for custom JavaScript function
   Example: { mode: "fn", fn: "document.title === 'Done'" }

OPTIONS:
- timeout: Maximum wait time in ms (default: 30000)
- ref: Element ref (for mode="ref")
- text: Text to wait for (for mode="text")
- url: URL pattern to wait for (for mode="url")
- state: "load", "domcontentloaded", or "networkidle" (for mode="loadState")
- fn: JavaScript expression that returns boolean (for mode="fn")

COMMON PATTERNS:
- Wait for element: { mode: "ref", ref: "@e5" }
- Wait for navigation: { mode: "loadState", state: "load" }
- Wait for dynamic content: { mode: "text", text: "Success" }
- Simple delay: { mode: "timeout", timeout: 2000 }

TOKEN-EFFICIENT: Use @ref for element-based waiting.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      mode: {
        type: 'string',
        enum: ['ref', 'timeout', 'text', 'url', 'loadState', 'fn'],
        description: 'Wait mode (default: timeout)',
      },
      ref: {
        type: 'string',
        description: 'Element ref to wait for (e.g., "e10" or "@e10")',
        pattern: '^@?e\\d+$',
      },
      timeout: {
        type: 'number',
        description: 'Maximum wait time in ms (default: 30000)',
      },
      text: {
        type: 'string',
        description: 'Text to wait for on page',
      },
      url: {
        type: 'string',
        description: 'URL pattern to wait for',
      },
      state: {
        type: 'string',
        enum: ['load', 'domcontentloaded', 'networkidle'],
        description: 'Load state to wait for',
      },
      fn: {
        type: 'string',
        description: 'JavaScript expression to wait for (must return boolean)',
      },
    },
  },
};
