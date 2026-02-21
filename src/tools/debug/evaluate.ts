import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * JavaScript evaluation tool
 *
 * Reference agent-browser:
 * - eval "document.title"    # Evaluate JavaScript in page context
 * - eval "1 + 1"             # Evaluate expression and return result
 */
export const evaluateTool: Tool = {
  name: 'browser_evaluate',
  description: `
**Execute JavaScript code in the page context and return the result.**

Use this tool to run arbitrary JavaScript code within the browser's page context, enabling debugging, inspection, and manipulation of page state.

**ACTIONS:**

**evaluate** - Execute JavaScript and return result
  code: JavaScript code to execute (required)
    Can be an expression, statement, or multiple statements

  context: Execution context (optional, default: "page")
    - "page": Execute in main page context (default)
    - "frame": Execute in currently selected frame context

  await: Set to true if code contains async operations (optional, default: false)
    When true, wraps code in an async IIFE and awaits the result

  serialize: Set to true to handle complex objects (optional, default: false)
    When true, attempts to serialize objects using JSON.stringify

**EXAMPLES:**

Get page title:
  browser_evaluate with code="document.title"

Get current URL:
  browser_evaluate with code="window.location.href"

Count elements:
  browser_evaluate with code="document.querySelectorAll('div').length"

Execute multiple statements:
  browser_evaluate with code="var x = 10; var y = 20; x + y"

Access localStorage:
  browser_evaluate with code="Object.keys(localStorage).length"

Get element text:
  browser_evaluate with code="document.querySelector('h1')?.textContent"

Check if element exists:
  browser_evaluate with code="!!document.querySelector('#my-element')"

Evaluate with async operation:
  browser_evaluate with code="await fetch('/api/data').then(r => r.json())", await=true

Get computed style:
  browser_evaluate with code="getComputedStyle(document.body).backgroundColor"

**OUTPUT:**
- result: The result of evaluating the JavaScript code
- type: The type of the result (string, number, boolean, object, undefined, etc.)
- error: Error message if the code threw an exception (optional)

**NOTES:**
- Code executes in the page's JavaScript context with full access to DOM, window, etc.
- Return value must be JSON-serializable (or use serialize: true for complex objects)
- Async operations should use await: true to properly handle promises
- Functions and complex objects cannot be directly returned (use serialize: true)
- The code has the same security context as the page (same-origin policy applies)
- Be careful with side effects - the code can modify page state
- Cannot access variables from previous evaluations (each evaluation is isolated)
- Use context: "frame" to execute in an iframe if one is currently selected
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      code: {
        type: 'string',
        description: 'JavaScript code to execute in page context'
      },
      context: {
        type: 'string',
        description: 'Execution context (page or frame)',
        enum: ['page', 'frame'],
        default: 'page'
      },
      await: {
        type: 'boolean',
        description: 'Wrap code in async IIFE and await result (for async operations)',
        default: false
      },
      serialize: {
        type: 'boolean',
        description: 'Attempt to serialize complex objects using JSON.stringify',
        default: false
      }
    },
    required: ['code']
  }
};

export async function evaluateToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const code = params.code as string;
  const context = (params.context as string) || 'page';
  const shouldAwait = params.await as boolean | undefined;
  const shouldSerialize = params.serialize as boolean | undefined;

  if (!code) {
    throw new Error('code is required');
  }

  try {
    // Get the appropriate frame
    const frame = context === 'frame' ? browserManager.getFrame() : browserManager.getPage().mainFrame();

    // Prepare the code to execute
    let codeToExecute = code;

    // Wrap in async IIFE if await is true
    if (shouldAwait) {
      codeToExecute = `(async () => { ${code} })()`;
    }

    // Execute the code
    const result = await frame.evaluate(codeToExecute);

    // Handle serialization
    let serializedResult: unknown;
    let type: string;

    if (result === undefined) {
      serializedResult = undefined;
      type = 'undefined';
    } else if (result === null) {
      serializedResult = null;
      type = 'null';
    } else if (shouldSerialize) {
      try {
        // Try to serialize using JSON.stringify in the page context
        // This handles circular references and complex objects better
        const serialized = await frame.evaluate((val) => {
          try {
            return JSON.stringify(val, (key, value) => {
              if (typeof value === 'function') {
                return `[Function: ${value.name || 'anonymous'}]`;
              }
              if (value instanceof Error) {
                return `[Error: ${value.message}]`;
              }
              if (typeof value === 'symbol') {
                return `[Symbol: ${value.toString()}]`;
              }
              return value;
            });
          } catch {
            return null;
          }
        }, result);
        serializedResult = serialized ? JSON.parse(serialized) : result;
        type = typeof result;
      } catch {
        // If serialization fails, try to return as-is
        serializedResult = result;
        type = typeof result;
      }
    } else {
      // Return result as-is
      serializedResult = result;
      type = typeof result;
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          result: serializedResult,
          type: type,
          context: context
        }, null, 2)
      }]
    };
  } catch (error) {
    // Handle execution errors
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: false,
          error: errorMessage,
          context: context,
          code: code
        }, null, 2)
      }]
    };
  }
}

export const evaluateToolDefinition = {
  name: evaluateTool.name,
  description: evaluateTool.description,
  inputSchema: evaluateTool.inputSchema
};
