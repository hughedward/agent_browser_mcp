import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * Cookies management tool
 *
 * Reference agent-browser:
 * - cookies                    # Get all cookies
 * - cookies set <name> <val>   # Set cookie
 * - cookies clear              # Clear cookies
 */
export const cookiesTool: Tool = {
  name: 'browser_cookies',
  description: `
**Manage browser cookies for the current page.**

Use this tool to get, set, or clear cookies in the current browser context.

**ACTIONS:**

**get** - Get all cookies for the current page
  action: "get"

**set** - Set a cookie
  action: "set"
  name: Cookie name (required)
  value: Cookie value (required)
  domain: Cookie domain (optional, defaults to current page domain)
  path: Cookie path (optional, defaults to "/")
  expires: Expiration timestamp in seconds (optional, session cookie if not set)
  httpOnly: HTTP-only flag (optional, default false)
  secure: Secure flag (optional, default false)
  sameSite: SameSite attribute (optional, default "Lax")

**clear** - Clear all cookies
  action: "clear"

**EXAMPLES:**

Get all cookies:
  browser_cookies with action="get"

Set a cookie:
  browser_cookies with action="set", name="session", value="abc123"
  browser_cookies with action="set", name="session", value="abc123", domain=".example.com", secure=true

Clear all cookies:
  browser_cookies with action="clear"

**OUTPUT:**
- get: Array of cookie objects
- set: Success message
- clear: Success message with count of cleared cookies
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (get, set, clear)',
        enum: ['get', 'set', 'clear']
      },
      name: {
        type: 'string',
        description: 'Cookie name (required for set action)'
      },
      value: {
        type: 'string',
        description: 'Cookie value (required for set action)'
      },
      domain: {
        type: 'string',
        description: 'Cookie domain (optional for set action, defaults to current page domain)'
      },
      path: {
        type: 'string',
        description: 'Cookie path (optional for set action, defaults to "/")'
      },
      expires: {
        type: 'number',
        description: 'Cookie expiration timestamp in seconds (optional for set action)'
      },
      httpOnly: {
        type: 'boolean',
        description: 'HTTP-only flag (optional for set action, default false)'
      },
      secure: {
        type: 'boolean',
        description: 'Secure flag (optional for set action, default false)'
      },
      sameSite: {
        type: 'string',
        description: 'SameSite attribute (optional for set action, default "Lax")',
        enum: ['Strict', 'Lax', 'None']
      }
    },
    required: ['action']
  }
};

export async function cookiesToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const context = browserManager.getContext();
  const action = params.action as string;

  if (!context) {
    throw new Error('No browser context available');
  }

  switch (action) {
    case 'get': {
      const cookies = await context.cookies();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(cookies, null, 2)
        }]
      };
    }

    case 'set': {
      if (!params.name) {
        throw new Error('name is required for set action');
      }
      if (!params.value) {
        throw new Error('value is required for set action');
      }

      const cookieData: any = {
        name: params.name,
        value: params.value,
        path: params.path || '/',
        sameSite: params.sameSite || 'Lax'
      };

      // Add optional parameters if provided
      if (params.domain) cookieData.domain = params.domain;
      if (params.expires !== undefined) cookieData.expires = params.expires;
      if (params.httpOnly !== undefined) cookieData.httpOnly = params.httpOnly;
      if (params.secure !== undefined) cookieData.secure = params.secure;

      // If domain not specified, use current page's domain
      if (!params.domain) {
        const url = page.url();
        try {
          const urlObj = new URL(url);
          cookieData.domain = urlObj.hostname;
        } catch {
          // Invalid URL, skip domain
        }
      }

      await context.addCookies([cookieData]);

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Cookie "${params.name}" has been set`,
            cookie: cookieData
          }, null, 2)
        }]
      };
    }

    case 'clear': {
      const cookiesBefore = await context.cookies();
      await context.clearCookies();
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Cleared ${cookiesBefore.length} cookies`,
            count: cookiesBefore.length
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const cookiesToolDefinition = {
  name: cookiesTool.name,
  description: cookiesTool.description,
  inputSchema: cookiesTool.inputSchema
};
