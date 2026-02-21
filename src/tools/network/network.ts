import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';

/**
 * Network interception and monitoring tool
 *
 * Reference agent-browser:
 * - network route <url> --abort              # Block requests matching URL
 * - network route <url> --body '{}'          # Mock response with JSON body
 * - network route <url> --status 404         # Respond with custom status
 * - network unroute [url]                    # Remove route (or all if no url)
 * - network requests [filter]                # List tracked requests
 */
export const networkTool: Tool = {
  name: 'browser_network',
  description: `
**Intercept and monitor network requests for testing and debugging.**

Use this tool to block requests, mock API responses, or view network traffic.

**ACTIONS:**

**route** - Intercept and modify/block requests
  action: "route"
  url: URL pattern to match (required, supports glob patterns like "**/api/**")
  abort: Set to true to block the request (optional)
  response.status: HTTP status code for mock response (optional, default 200)
  response.body: Response body for mock response (optional)
  response.contentType: Content-Type header (optional, default "application/json")
  response.headers: Object with additional response headers (optional)

  Notes:
  - If abort is true, the request will be blocked
  - If response is provided, the request will be fulfilled with the mock data
  - If neither abort nor response is provided, the request continues normally

**unroute** - Remove interception rules
  action: "unroute"
  url: URL pattern to remove (optional, if not specified removes all routes)

**requests** - View tracked network requests
  action: "requests"
  filter: Optional URL filter string to match (optional)
  clear: Set to true to clear tracked requests after viewing (optional)

**EXAMPLES:**

Block all analytics requests:
  browser_network with action="route", url="**/analytics/**", abort=true

Mock an API endpoint with JSON response:
  browser_network with action="route", url="**/api/user**", response={status: 200, body: '{"name": "Test User"}'}

Mock with custom status and headers:
  browser_network with action="route", url="**/api/error**", response={status: 500, body: "Internal Error", contentType: "text/plain"}

Remove specific route:
  browser_network with action="unroute", url="**/api/**"

Remove all routes:
  browser_network with action="unroute"

View all tracked requests:
  browser_network with action="requests"

View requests matching a filter:
  browser_network with action="requests", filter="api"

View and clear requests:
  browser_network with action="requests", clear=true

**OUTPUT:**
- route: Success message with route details
- unroute: Success message with removed route count
- requests: Array of tracked requests with URL, method, headers, timestamp, and resource type

**NOTES:**
- URL patterns use glob matching (e.g., "**" matches any characters, including path separators)
- Multiple routes can be active simultaneously
- Routes persist until removed or browser is closed
- Request tracking starts automatically when browser is launched
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (route, unroute, requests)',
        enum: ['route', 'unroute', 'requests']
      },
      url: {
        type: 'string',
        description: 'URL pattern for route/unroute (supports glob patterns like "**/api/**")'
      },
      abort: {
        type: 'boolean',
        description: 'Block matching requests (only for route action)'
      },
      response: {
        type: 'object',
        description: 'Mock response configuration (only for route action)',
        properties: {
          status: {
            type: 'number',
            description: 'HTTP status code'
          },
          body: {
            type: 'string',
            description: 'Response body'
          },
          contentType: {
            type: 'string',
            description: 'Content-Type header'
          },
          headers: {
            type: 'object',
            description: 'Additional response headers as key-value pairs'
          }
        }
      },
      filter: {
        type: 'string',
        description: 'URL filter for requests action (optional)'
      },
      clear: {
        type: 'boolean',
        description: 'Clear tracked requests after viewing (only for requests action)'
      }
    },
    required: ['action']
  }
};

export async function networkToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'route': {
      if (!params.url) {
        throw new Error('url is required for route action');
      }

      const url = params.url as string;
      const abort = params.abort as boolean | undefined;
      const response = params.response as {
        status?: number;
        body?: string;
        contentType?: string;
        headers?: Record<string, string>;
      } | undefined;

      // Build route options
      const options: {
        response?: {
          status?: number;
          body?: string;
          contentType?: string;
          headers?: Record<string, string>;
        };
        abort?: boolean;
      } = {};

      if (abort) {
        options.abort = true;
      } else if (response) {
        options.response = {
          status: response.status ?? 200,
          body: response.body,
          contentType: response.contentType ?? 'application/json',
          headers: response.headers
        };
      }

      // Add the route using BrowserManager's existing method
      await browserManager.addRoute(url, options);

      const actionType = abort ? 'blocked' : response ? 'mocked' : 'intercepted';
      const responseInfo = response
        ? ` with status ${response.status}${response.body ? ` and body` : ''}`
        : '';

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: `Route added: Requests matching "${url}" will be ${actionType}${responseInfo}`,
            url: url,
            action: actionType,
            config: options
          }, null, 2)
        }]
      };
    }

    case 'unroute': {
      const url = params.url as string | undefined;

      // Get current routes count before removal (if we had a method to list them)
      // For now, just remove and report success
      await browserManager.removeRoute(url);

      if (url) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Removed route matching "${url}"`,
              url: url
            }, null, 2)
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Removed all routes'
            }, null, 2)
          }]
        };
      }
    }

    case 'requests': {
      const filter = params.filter as string | undefined;
      const clear = params.clear as boolean | undefined;

      // Get tracked requests using BrowserManager's existing method
      const requests = browserManager.getRequests(filter);

      // Clear if requested
      if (clear) {
        browserManager.clearRequests();
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            count: requests.length,
            filter: filter || 'none',
            cleared: clear || false,
            requests: requests.map(r => ({
              url: r.url,
              method: r.method,
              resourceType: r.resourceType,
              timestamp: new Date(r.timestamp).toISOString(),
              headers: r.headers
            }))
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const networkToolDefinition = {
  name: networkTool.name,
  description: networkTool.description,
  inputSchema: networkTool.inputSchema
};
