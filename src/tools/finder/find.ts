import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import type { Page, Locator } from 'playwright-core';

/**
 * Parse locator type and value
 */
interface LocatorInfo {
  type: 'role' | 'text' | 'label' | 'placeholder' | 'alt' | 'title' | 'testid' | 'selector' | 'first' | 'last' | 'nth';
  value: string;
  roleType?: string;  // For role type: role button "Submit" -> roleType="button", value="Submit"
  nth?: number;
  exact?: boolean;
}

/**
 * Parse the locator argument
 */
function parseLocator(locatorArg: string): LocatorInfo {
  const parts = locatorArg.trim().split(/\s+/);
  const type = parts[0] as LocatorInfo['type'];
  const value = parts.slice(1).join(' ');

  if (!value) {
    throw new Error(`Locator value missing for type: ${type}`);
  }

  // Special handling for role: role button "Submit" -> roleType="button", value="Submit"
  if (type === 'role') {
    const roleParts = value.split(/\s+/);
    const roleType = roleParts[0];  // e.g., "button"
    const nameValue = roleParts.slice(1).join(' ');  // e.g., "\"Submit\""

    // Extract name from quotes if present
    const nameMatch = nameValue.match(/^"(.+)"$/);
    const name = nameMatch ? nameMatch[1] : nameValue;

    return { type, value: name || '', roleType };
  }

  return { type, value };
}

/**
 * Build Playwright locator from semantic locator info
 */
function buildLocator(page: Page, info: LocatorInfo): Locator {
  const exact = info.exact !== false; // default to exact match

  switch (info.type) {
    case 'role':
      // role button "Submit" -> getByRole('button', { name: 'Submit' })
      // role link -> getByRole('link') (no name filter)
      // info.roleType = "button", info.value = "Submit" (or empty)
      const options: { exact?: boolean; name?: string } = { exact };
      if (info.value) {
        options.name = info.value;
      }
      return page.getByRole(info.roleType as any, options);

    case 'text':
      // text "Sign In" -> getByText('Sign In', { exact: true })
      return page.getByText(info.value, { exact });

    case 'label':
      // label "Email" -> getByLabel('Email', { exact: true })
      return page.getByLabel(info.value, { exact });

    case 'placeholder':
      // placeholder "Search" -> getByPlaceholder('Search', { exact: true })
      return page.getByPlaceholder(info.value, { exact });

    case 'alt':
      // alt "Logo" -> getByAltText('Logo', { exact: true })
      return page.getByAltText(info.value, { exact });

    case 'title':
      // title "Close" -> getByTitle('Close', { exact: true })
      return page.getByTitle(info.value, { exact });

    case 'testid':
      // testid "submit-btn" -> getByTestId('submit-btn')
      return page.getByTestId(info.value);

    case 'first':
      // first ".item" -> locator('.item').first()
      return page.locator(info.value).first();

    case 'last':
      // last ".item" -> locator('.item').last()
      return page.locator(info.value).last();

    case 'nth':
      // nth 2 ".item" -> locator('.item').nth(2)
      const nthMatch = info.value.match(/^(\d+)\s+(.+)$/);
      if (!nthMatch) {
        throw new Error(`Invalid nth locator format: "${info.value}". Expected: nth <index> <selector>`);
      }
      const index = parseInt(nthMatch[1], 10);
      const selector = nthMatch[2];
      return page.locator(selector).nth(index);

    case 'selector':
      // Direct CSS selector
      return page.locator(info.value);

    default:
      throw new Error(`Unknown locator type: ${info.type}`);
  }
}

/**
 * Execute action on locator
 */
async function executeAction(
  locator: Locator,
  action: string,
  value?: string
): Promise<{ ref?: string; result?: any }> {
  switch (action) {
    case 'click':
      await locator.click();
      return { ref: generateRef() };

    case 'fill':
      if (!value) {
        throw new Error('fill action requires a value parameter');
      }
      await locator.fill(value);
      return { ref: generateRef() };

    case 'type':
      if (!value) {
        throw new Error('type action requires a value parameter');
      }
      await locator.type(value);
      return { ref: generateRef() };

    case 'hover':
      await locator.hover();
      return { ref: generateRef() };

    case 'focus':
      await locator.focus();
      return { ref: generateRef() };

    case 'check':
      await locator.check();
      return { ref: generateRef() };

    case 'uncheck':
      await locator.uncheck();
      return { ref: generateRef() };

    case 'text':
      const text = await locator.textContent();
      return { result: text?.trim() || '' };

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

/**
 * Generate a new ref ID
 * Note: This is a simple implementation. In production, you'd want to
 * cache this ref in BrowserManager's refMap for later use.
 */
function generateRef(): string {
  // For now, return a placeholder. The actual ref will be created
  // when user takes a snapshot. This tool is primarily for quick actions.
  return `e${Date.now() % 1000}`;
}

export const findTool: Tool = {
  name: 'browser_find',
  description: `
**Unified semantic locator for finding and interacting with elements.**

Use this tool to find elements by semantic attributes (role, text, label, etc.) and optionally perform an action.

**WHEN TO USE:**
- When you need to find an element without taking a full snapshot
- When you know the semantic attributes of an element
- For quick one-off interactions without ref caching
- When refs from snapshot are unavailable or unreliable

**LOCATOR TYPES:**
- role <role> "name"           - Find by ARIA role (button, link, textbox, etc.)
- text <text>                   - Find by text content
- label <label>                 - Find by associated label
- placeholder <placeholder>     - Find by placeholder text
- alt <alt-text>                - Find by alt text (images)
- title <title>                 - Find by title attribute
- testid <id>                   - Find by test id
- first <selector>              - Find first matching element
- last <selector>               - Find last matching element
- nth <n> <selector>            - Find nth matching element (0-based)

**ACTIONS:**
- click                         - Click the element
- fill <value>                  - Clear and fill input/textarea
- type <value>                  - Type without clearing
- hover                         - Hover over element
- focus                         - Focus element
- check                         - Check checkbox/radio
- uncheck                       - Uncheck checkbox/radio
- text                          - Get element text content

**EXAMPLES:**
find role button click --name "Submit"
find text "Sign In" click
find label "Email" fill "user@test.com"
find placeholder "Search" type "query"
find testid "submit-btn" click
find first ".item" click
find last ".item" hover
find nth 2 "a" text

**NOTE:** This tool returns a ref but does NOT cache it in BrowserManager.
For persistent refs that survive page changes, use browser_snapshot instead.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      locator: {
        type: 'string',
        description: 'Semantic locator (e.g., "role button", "text Sign In", "label Email")'
      },
      action: {
        type: 'string',
        description: 'Action to perform (click, fill, type, hover, focus, check, uncheck, text)',
        enum: ['click', 'fill', 'type', 'hover', 'focus', 'check', 'uncheck', 'text']
      },
      value: {
        type: 'string',
        description: 'Value for fill/type actions'
      },
      exact: {
        type: 'boolean',
        description: 'Use exact matching (default: true)',
        default: true
      }
    },
    required: ['locator', 'action']
  }
};

export async function findToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();

  // Parse locator
  const locatorInfo = parseLocator(params.locator);
  locatorInfo.exact = params.exact !== false;

  // Build Playwright locator
  const locator = buildLocator(page, locatorInfo);

  // Execute action
  const result = await executeAction(locator, params.action, params.value);

  // Format response
  if (result.ref) {
    return {
      content: [{
        type: 'text',
        text: `Action "${params.action}" executed successfully. Ref: ${result.ref}`
      }]
    };
  } else if (result.result !== undefined) {
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(result.result, null, 2)
      }]
    };
  } else {
    return {
      content: [{
        type: 'text',
        text: `Action "${params.action}" executed successfully`
      }]
    };
  }
}

export const findToolDefinition = {
  name: findTool.name,
  description: findTool.description,
  inputSchema: findTool.inputSchema
};
