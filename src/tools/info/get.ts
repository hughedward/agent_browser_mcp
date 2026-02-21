import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';

/**
 * Unified get tool for retrieving information from the page or elements
 */
export const getTool: Tool = {
  name: 'browser_get',
  description: `
**Unified tool for getting information from the page or elements.**

Use this tool to retrieve various types of information from the current page or specific elements.

**WHEN TO USE:**
- Get element properties (text, HTML, value, attributes)
- Get page information (URL, title)
- Count elements matching a selector
- Get element geometry (bounding box)
- Get computed styles

**PROPERTIES:**
- text        - Get element text content
- html        - Get element innerHTML
- value       - Get input/textarea value
- attribute   - Get element attribute (requires 'attr' parameter)
- url         - Get current page URL
- title       - Get page title
- count       - Count elements matching selector
- box         - Get bounding box (x, y, width, height)
- styles      - Get computed styles (default: all, use 'property' for specific)

**TARGETING:**
Use either 'ref' (from browser_snapshot) or 'selector' (CSS selector).

**EXAMPLES:**
Get text from ref:
  get text @e1
  get text @e1

Get HTML:
  get html @e2

Get input value:
  get value @e3

Get attribute:
  get attribute @e1 --attr href
  get attribute @e1 --attr data-id

Get page info:
  get url
  get title

Count elements:
  get count --selector ".item"

Get geometry:
  get box @e1

Get styles:
  get styles @e1
  get styles @e1 --property color
  get styles @e1 --property font-size

**OUTPUT:**
- text/html/value: String content
- attribute: Attribute value or null if not present
- url/title: String
- count: Number
- box: Object with x, y, width, height
- styles: Object with computed style properties
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      property: {
        type: 'string',
        description: 'Property to get (text, html, value, attribute, url, title, count, box, styles)',
        enum: ['text', 'html', 'value', 'attribute', 'url', 'title', 'count', 'box', 'styles']
      },
      ref: {
        type: 'string',
        description: 'Element ref (e.g., "e1" or "@e1")',
        pattern: '^@?e\\d+$'
      },
      selector: {
        type: 'string',
        description: 'CSS selector (alternative to ref)'
      },
      attr: {
        type: 'string',
        description: 'Attribute name (required when property="attribute")'
      },
      styleProperty: {
        type: 'string',
        description: 'Specific CSS property to get (optional, for property="styles")'
      }
    },
    required: ['property']
  }
};

export async function getToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const property = params.property as string;

  // Page-level properties (no ref/selector needed)
  if (property === 'url') {
    const url = page.url();
    return {
      content: [{
        type: 'text',
        text: url
      }]
    };
  }

  if (property === 'title') {
    const title = await page.title();
    return {
      content: [{
        type: 'text',
        text: title
      }]
    };
  }

  // Count property (requires selector)
  if (property === 'count') {
    if (!params.selector) {
      throw new Error('count property requires a selector parameter');
    }
    const count = await page.locator(params.selector).count();
    return {
      content: [{
        type: 'text',
        text: String(count)
      }]
    };
  }

  // Element-level properties (require ref or selector)
  if (!params.ref && !params.selector) {
    throw new Error(`${property} property requires either ref or selector parameter`);
  }

  // Get locator
  let locator;
  if (params.ref) {
    const refMap = browserManager.getRefMap();
    locator = resolveRef(page, params.ref, refMap);
  } else {
    locator = page.locator(params.selector);
  }

  // Get the requested property
  switch (property) {
    case 'text': {
      const text = await locator.textContent();
      return {
        content: [{
          type: 'text',
          text: text?.trim() || ''
        }]
      };
    }

    case 'html': {
      const html = await locator.innerHTML();
      return {
        content: [{
          type: 'text',
          text: html
        }]
      };
    }

    case 'value': {
      const value = await locator.inputValue();
      return {
        content: [{
          type: 'text',
          text: value
        }]
      };
    }

    case 'attribute': {
      if (!params.attr) {
        throw new Error('attribute property requires attr parameter');
      }
      const attr = await locator.getAttribute(params.attr);
      return {
        content: [{
          type: 'text',
          text: attr === null ? 'null' : attr
        }]
      };
    }

    case 'box': {
      const box = await locator.boundingBox();
      if (!box) {
        throw new Error('Element not visible or has no bounding box');
      }
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(box, null, 2)
        }]
      };
    }

    case 'styles': {
      if (params.styleProperty) {
        // Get specific style property
        const style = await locator.evaluate((el, prop) => {
          return window.getComputedStyle(el).getPropertyValue(prop);
        }, params.styleProperty);
        return {
          content: [{
            type: 'text',
            text: style?.trim() || ''
          }]
        };
      } else {
        // Get all common computed styles
        const styles = await locator.evaluate((el) => {
          const computed = window.getComputedStyle(el);
          return {
            display: computed.display,
            visibility: computed.visibility,
            opacity: computed.opacity,
            position: computed.position,
            width: computed.width,
            height: computed.height,
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            fontFamily: computed.fontFamily,
            textAlign: computed.textAlign,
            padding: computed.padding,
            margin: computed.margin,
            border: computed.border
          };
        });
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(styles, null, 2)
          }]
        };
      }
    }

    default:
      throw new Error(`Unknown property: ${property}`);
  }
}

export const getToolDefinition = {
  name: getTool.name,
  description: getTool.description,
  inputSchema: getTool.inputSchema
};
