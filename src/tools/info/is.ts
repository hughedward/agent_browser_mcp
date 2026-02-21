import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * State checking tool for verifying element states
 */
export const isTool: Tool = {
  name: 'browser_is',
  description: `
**State checking tool for verifying element visibility and state.**

Use this tool to check the current state of an element.

**WHEN TO USE:**
- Verify element is visible before interaction
- Check if element is enabled/disabled
- Verify checkbox/radio state
- Check if element is editable
- Verify element is readonly

**CHECKS:**
- visible     - Check if element is visible (in DOM and not hidden)
- enabled     - Check if element is enabled (not disabled)
- disabled    - Check if element is disabled
- checked     - Check if checkbox/radio is checked
- unchecked   - Check if checkbox/radio is unchecked
- editable    - Check if element is editable (not readonly)
- readonly    - Check if element is readonly
- hidden      - Check if element is hidden (opposite of visible)
- focused     - Check if element has focus

**TARGETING:**
Use either 'ref' (from browser_snapshot) or 'selector' (CSS selector).

**EXAMPLES:**
Check visibility:
  is visible @e1
  is hidden @e1

Check enabled state:
  is enabled @e2
  is disabled @e2

Check checkbox/radio:
  is checked @e3
  is unchecked @e3

Check editable state:
  is editable @e4
  is readonly @e4

Check focus:
  is focused @e5

**OUTPUT:**
Returns "true" or "false" as text.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      check: {
        type: 'string',
        description: 'State check to perform',
        enum: ['visible', 'enabled', 'disabled', 'checked', 'unchecked', 'editable', 'readonly', 'hidden', 'focused']
      },
      ref: {
        type: 'string',
        description: 'Element ref (e.g., "e1" or "@e1")',
        pattern: '^@?e\\d+$'
      },
      selector: {
        type: 'string',
        description: 'CSS selector (alternative to ref)'
      }
    },
    required: ['check']
  }
};

export async function isToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const check = params.check as string;

  // Validate targeting
  if (!params.ref && !params.selector) {
    throw new Error(`${check} check requires either ref or selector parameter`);
  }

  // Get locator
  let locator;
  if (params.ref) {
    const refMap = browserManager.getRefMap();
    locator = resolveRef(page, params.ref, refMap);
  } else {
    locator = page.locator(params.selector);
  }

  // Perform the check
  let result: boolean;

  switch (check) {
    case 'visible': {
      result = await locator.isVisible();
      break;
    }

    case 'hidden': {
      result = await locator.isHidden();
      break;
    }

    case 'enabled': {
      result = await locator.isEnabled();
      break;
    }

    case 'disabled': {
      result = !(await locator.isEnabled());
      break;
    }

    case 'checked': {
      result = await locator.isChecked();
      break;
    }

    case 'unchecked': {
      result = !(await locator.isChecked());
      break;
    }

    case 'editable': {
      const readonly = await locator.evaluate((el) => {
        return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? el.readOnly
          : false;
      });
      result = !readonly;
      break;
    }

    case 'readonly': {
      const readonly = await locator.evaluate((el) => {
        return el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
          ? el.readOnly
          : false;
      });
      result = readonly;
      break;
    }

    case 'focused': {
      result = await locator.evaluate((el) => {
        return document.activeElement === el;
      });
      break;
    }

    default:
      throw new Error(`Unknown check: ${check}`);
  }

  return {
    content: [{
      type: 'text',
      text: String(result)
    }]
  };
}

export const isToolDefinition = {
  name: isTool.name,
  description: isTool.description,
  inputSchema: isTool.inputSchema
};
