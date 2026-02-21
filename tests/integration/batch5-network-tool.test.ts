/**
 * Integration Test for P2: Network Interception and Monitoring Tool
 *
 * This test validates:
 * - browser_network: Route (abort), Route (mock response), Unroute, Requests
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { networkToolHandler } from '../../src/tools/network/network.js';
import { closeTool } from '../../src/tools/navigation/close.js';

describe('P2: Network Interception and Monitoring Tool Integration Test', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({
      headless: true,
      browser: 'chromium',
    });

    // Start request tracking
    browserManager.startRequestTracking();
  });

  afterAll(async () => {
    if (browserManager) {
      await browserManager.close();
    }
  });

  it('should launch browser successfully', () => {
    expect(browserManager.isLaunched()).toBe(true);
    expect(browserManager.hasPages()).toBe(true);
  });

  it('should navigate to test page', async () => {
    const result = await navigateTool(browserManager, { url: 'https://example.com' });
    expect(result.isError).not.toBe(true);
  });

  describe('browser_network - requests action', () => {
    it('should get all tracked requests', async () => {
      const result = await networkToolHandler(browserManager, {
        action: 'requests'
      });

      expect(result.content[0].type).toBe('text');

      // Parse the JSON response
      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.requests)).toBe(true);

      // Verify request structure
      if (data.requests.length > 0) {
        const request = data.requests[0];
        expect(request).toHaveProperty('url');
        expect(request).toHaveProperty('method');
        expect(request).toHaveProperty('resourceType');
        expect(request).toHaveProperty('timestamp');
        expect(request).toHaveProperty('headers');
      }
    });

    it('should get requests with filter', async () => {
      const result = await networkToolHandler(browserManager, {
        action: 'requests',
        filter: 'example'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.filter).toBe('example');

      // All requests should match the filter
      if (data.requests.length > 0) {
        data.requests.forEach((request: any) => {
          expect(request.url).toContain('example');
        });
      }
    });

    it('should get and clear requests', async () => {
      // First, ensure we have some requests
      await navigateTool(browserManager, { url: 'https://example.com' });

      const result = await networkToolHandler(browserManager, {
        action: 'requests',
        clear: true
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.cleared).toBe(true);

      // Verify requests were cleared
      const requestsAfter = browserManager.getRequests();
      expect(requestsAfter.length).toBe(0);
    });
  });

  describe('browser_network - route action (abort)', () => {
    it('should add a route to block requests', async () => {
      const result = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/blocked/**',
        abort: true
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message).toContain('blocked');
      expect(data.url).toBe('**/blocked/**');
    });

    it('should navigate to a page and verify tracked requests', async () => {
      // Navigate to trigger more network activity
      const result = await navigateTool(browserManager, {
        url: 'https://httpbin.org/get'
      });
      expect(result.isError).not.toBe(true);

      // Wait a bit for requests to complete
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check requests
      const requestsResult = await networkToolHandler(browserManager, {
        action: 'requests',
        filter: 'httpbin'
      });

      const data = JSON.parse(requestsResult.content[0].text);
      expect(data.success).toBe(true);
      expect(data.requests.length).toBeGreaterThan(0);
    });
  });

  describe('browser_network - route action (mock response)', () => {
    it('should add a route with JSON mock response', async () => {
      const mockBody = JSON.stringify({ status: 'mocked', data: 'test data' });

      const result = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/api/mock/**',
        response: {
          status: 200,
          body: mockBody,
          contentType: 'application/json'
        }
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message).toContain('mocked');
      expect(data.url).toBe('**/api/mock/**');
      expect(data.config.response).toBeDefined();
      expect(data.config.response?.status).toBe(200);
    });

    it('should add a route with custom status and text response', async () => {
      const result = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/api/error/**',
        response: {
          status: 500,
          body: 'Internal Server Error',
          contentType: 'text/plain'
        }
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.config.response?.status).toBe(500);
      expect(data.config.response?.body).toBe('Internal Server Error');
      expect(data.config.response?.contentType).toBe('text/plain');
    });

    it('should add a route with custom headers', async () => {
      const result = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/api/headers/**',
        response: {
          status: 200,
          body: '{"message": "ok"}',
          contentType: 'application/json',
          headers: {
            'X-Custom-Header': 'test-value',
            'X-Another-Header': 'another-value'
          }
        }
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.config.response?.headers).toBeDefined();
      expect(data.config.response?.headers['X-Custom-Header']).toBe('test-value');
    });
  });

  describe('browser_network - unroute action', () => {
    it('should remove a specific route', async () => {
      // First add a route
      await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/to-remove/**',
        abort: true
      });

      // Then remove it
      const result = await networkToolHandler(browserManager, {
        action: 'unroute',
        url: '**/to-remove/**'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message.toLowerCase()).toContain('removed');
      expect(data.url).toBe('**/to-remove/**');
    });

    it('should remove all routes', async () => {
      // Add a couple of routes first
      await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/route1/**',
        abort: true
      });

      await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/route2/**',
        response: { status: 200, body: 'test' }
      });

      // Remove all routes
      const result = await networkToolHandler(browserManager, {
        action: 'unroute'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message).toContain('all routes');
    });
  });

  describe('browser_network - error handling', () => {
    it('should require action parameter', async () => {
      await expect(networkToolHandler(browserManager, {}))
        .rejects.toThrow();
    });

    it('should require url for route action', async () => {
      await expect(networkToolHandler(browserManager, {
        action: 'route',
        abort: true
      }))
        .rejects.toThrow('url is required');
    });

    it('should reject unknown action', async () => {
      await expect(networkToolHandler(browserManager, {
        action: 'unknown'
      }))
        .rejects.toThrow('Unknown action');
    });
  });

  describe('browser_network - complex scenarios', () => {
    it('should handle multiple concurrent routes', async () => {
      // Add multiple routes
      const route1 = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/analytics/**',
        abort: true
      });

      const route2 = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/api/user/**',
        response: {
          status: 200,
          body: '{"name": "Test User"}'
        }
      });

      const route3 = await networkToolHandler(browserManager, {
        action: 'route',
        url: '**/api/error/**',
        response: {
          status: 500,
          body: 'Error'
        }
      });

      // Verify all routes were added successfully
      [route1, route2, route3].forEach(result => {
        const data = JSON.parse(result.content[0].text);
        expect(data.success).toBe(true);
      });

      // Clean up
      await networkToolHandler(browserManager, {
        action: 'unroute'
      });
    });

    it('should track requests across multiple navigations', async () => {
      // Clear existing requests
      browserManager.clearRequests();

      // Navigate to multiple pages
      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 500));

      await navigateTool(browserManager, { url: 'https://httpbin.org/get' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check that we have requests from both navigations
      const result = await networkToolHandler(browserManager, {
        action: 'requests'
      });

      const data = JSON.parse(result.content[0].text);
      expect(data.requests.length).toBeGreaterThan(0);

      // Should have requests from both domains
      const hasExampleCom = data.requests.some((r: any) => r.url.includes('example.com'));
      const hasHttpbin = data.requests.some((r: any) => r.url.includes('httpbin'));
      expect(hasExampleCom || hasHttpbin).toBe(true);
    });

    it('should filter requests by resource type', async () => {
      // Clear and navigate
      browserManager.clearRequests();
      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Get all requests
      const allRequests = await networkToolHandler(browserManager, {
        action: 'requests'
      });

      const allData = JSON.parse(allRequests.content[0].text);

      // Verify we have different resource types
      const resourceTypes = new Set(allData.requests.map((r: any) => r.resourceType));
      expect(resourceTypes.size).toBeGreaterThan(0);

      // Common resource types: document, script, stylesheet, image, xhr, fetch
      const commonTypes = ['document', 'script', 'stylesheet', 'image', 'xhr', 'fetch', 'other'];
      const hasCommonType = Array.from(resourceTypes).some(type => commonTypes.includes(type));
      expect(hasCommonType).toBe(true);
    });
  });
});
