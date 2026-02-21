/**
 * Integration Test for Batch 2: Session and Storage Management Tools
 *
 * This test validates:
 * - browser_cookies: Get, set, and clear cookies
 * - browser_storage: Get, set, and clear localStorage/sessionStorage
 * - browser_state: Save, load, list, show, and clear state files
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { cookiesToolHandler } from '../../src/tools/storage/cookies.js';
import { storageToolHandler } from '../../src/tools/storage/storage.js';
import { stateToolHandler } from '../../src/tools/state/state.js';
import { closeTool } from '../../src/tools/navigation/close.js';
import { existsSync, unlinkSync } from 'node:fs';
import path from 'node:path';
import os from 'node:os';

describe('Batch 2: Session and Storage Management Tools Integration Test', () => {
  let browserManager: BrowserManager;
  const testStatePath = path.join(os.tmpdir(), 'test-state.json');

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({
      headless: true,
      browser: 'chromium',
    });

    // Clean up any existing test state file
    if (existsSync(testStatePath)) {
      unlinkSync(testStatePath);
    }
  });

  afterAll(async () => {
    if (browserManager) {
      await browserManager.close();
    }

    // Clean up test state file
    if (existsSync(testStatePath)) {
      unlinkSync(testStatePath);
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

  describe('browser_cookies', () => {
    it('should get all cookies', async () => {
      const result = await cookiesToolHandler(browserManager, {
        action: 'get'
      });

      expect(result.content[0].type).toBe('text');

      // Parse the JSON response
      const cookies = JSON.parse(result.content[0].text);
      expect(Array.isArray(cookies)).toBe(true);
    });

    it('should set a cookie', async () => {
      const result = await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'test_cookie',
        value: 'test_value',
        domain: '.example.com'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.message).toContain('test_cookie');

      // Verify the cookie was set
      const getCookies = await cookiesToolHandler(browserManager, {
        action: 'get'
      });
      const cookies = JSON.parse(getCookies.content[0].text);
      const testCookie = cookies.find((c: any) => c.name === 'test_cookie');
      expect(testCookie).toBeDefined();
      expect(testCookie.value).toBe('test_value');
    });

    it('should set a cookie with optional parameters', async () => {
      const result = await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'advanced_cookie',
        value: 'advanced_value',
        path: '/test',
        secure: true,
        httpOnly: false,
        sameSite: 'Strict'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.cookie.path).toBe('/test');
      expect(response.cookie.secure).toBe(true);
      expect(response.cookie.sameSite).toBe('Strict');
    });

    it('should clear all cookies', async () => {
      // First set a cookie
      await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'to_be_cleared',
        value: 'value'
      });

      // Clear all cookies
      const result = await cookiesToolHandler(browserManager, {
        action: 'clear'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.count).toBeGreaterThan(0);

      // Verify cookies are cleared
      const getCookies = await cookiesToolHandler(browserManager, {
        action: 'get'
      });
      const cookies = JSON.parse(getCookies.content[0].text);
      expect(cookies.length).toBe(0);
    });

    it('should require name and value for set action', async () => {
      await expect(cookiesToolHandler(browserManager, {
        action: 'set'
      })).rejects.toThrow('name is required');

      await expect(cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'test'
      })).rejects.toThrow('value is required');
    });
  });

  describe('browser_storage', () => {
    it('should set localStorage item', async () => {
      const result = await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'test_key',
        value: 'test_value'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.message).toContain('test_key');
    });

    it('should get all localStorage items', async () => {
      // Set multiple items
      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'key1',
        value: 'value1'
      });

      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'key2',
        value: 'value2'
      });

      const result = await storageToolHandler(browserManager, {
        action: 'get',
        type: 'local'
      });

      expect(result.content[0].type).toBe('text');

      const items = JSON.parse(result.content[0].text);
      expect(typeof items).toBe('object');
      expect(items.key1).toBe('value1');
      expect(items.key2).toBe('value2');
    });

    it('should get specific localStorage key', async () => {
      const result = await storageToolHandler(browserManager, {
        action: 'get',
        type: 'local',
        key: 'key1'
      });

      expect(result.content[0].text).toBe('value1');
    });

    it('should clear all localStorage', async () => {
      // First, clear any existing items from previous tests
      await storageToolHandler(browserManager, {
        action: 'clear',
        type: 'local'
      });

      // Set some items
      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'temp1',
        value: 'value1'
      });

      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'temp2',
        value: 'value2'
      });

      // Clear all
      const result = await storageToolHandler(browserManager, {
        action: 'clear',
        type: 'local'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.count).toBeGreaterThanOrEqual(0);

      // Verify cleared
      const getItems = await storageToolHandler(browserManager, {
        action: 'get',
        type: 'local'
      });
      const items = JSON.parse(getItems.content[0].text);
      expect(Object.keys(items).length).toBe(0);
    });

    it('should work with sessionStorage', async () => {
      // Set sessionStorage
      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'session',
        key: 'session_key',
        value: 'session_value'
      });

      // Get specific key
      const result = await storageToolHandler(browserManager, {
        action: 'get',
        type: 'session',
        key: 'session_key'
      });

      expect(result.content[0].text).toBe('session_value');

      // Clear sessionStorage
      const clearResult = await storageToolHandler(browserManager, {
        action: 'clear',
        type: 'session'
      });

      const response = JSON.parse(clearResult.content[0].text);
      expect(response.success).toBe(true);
    });

    it('should require key for set action', async () => {
      await expect(storageToolHandler(browserManager, {
        action: 'set',
        type: 'local'
      })).rejects.toThrow('key is required');
    });
  });

  describe('browser_state', () => {
    it('should save state to file', async () => {
      // Set up some state
      await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'session_id',
        value: 'abc123'
      });

      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'user',
        value: 'john_doe'
      });

      // Save state
      const result = await stateToolHandler(browserManager, {
        action: 'save',
        path: testStatePath
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.path).toBe(testStatePath);

      // Verify file exists
      expect(existsSync(testStatePath)).toBe(true);
    });

    it('should show state summary', async () => {
      const result = await stateToolHandler(browserManager, {
        action: 'show',
        path: testStatePath
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.state.cookies).toBeGreaterThan(0);
      expect(response.state.origins).toBeGreaterThan(0);
      expect(response.state.file).toBe(testStatePath);
    });

    it('should list state files', async () => {
      const result = await stateToolHandler(browserManager, {
        action: 'list'
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.directory).toBeDefined();
      expect(Array.isArray(response.files)).toBe(true);
    });

    it('should require path for save action', async () => {
      await expect(stateToolHandler(browserManager, {
        action: 'save'
      })).rejects.toThrow('path is required');
    });

    it('should require path for show action', async () => {
      await expect(stateToolHandler(browserManager, {
        action: 'show'
      })).rejects.toThrow('path is required');
    });

    it('should clear specific state file', async () => {
      // Verify file exists
      expect(existsSync(testStatePath)).toBe(true);

      // Clear the file
      const result = await stateToolHandler(browserManager, {
        action: 'clear',
        path: testStatePath
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.path).toBe(testStatePath);

      // Verify file is deleted
      expect(existsSync(testStatePath)).toBe(false);
    });

    it('should handle load action', async () => {
      // First save a state file
      await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'test',
        value: 'value'
      });

      await stateToolHandler(browserManager, {
        action: 'save',
        path: testStatePath
      });

      // Load the state file
      const result = await stateToolHandler(browserManager, {
        action: 'load',
        path: testStatePath
      });

      expect(result.content[0].type).toBe('text');

      const response = JSON.parse(result.content[0].text);
      expect(response.success).toBe(true);
      expect(response.state).toBeDefined();
      expect(response.state.cookies).toBeGreaterThan(0);
    });

    it('should handle non-existent state file', async () => {
      await expect(stateToolHandler(browserManager, {
        action: 'show',
        path: '/non/existent/path.json'
      })).rejects.toThrow('State file not found');
    });
  });

  describe('combined workflow', () => {
    it('should work through cookies -> storage -> state workflow', async () => {
      // Navigate to a page
      await navigateTool(browserManager, { url: 'https://example.com' });

      // Set cookies
      await cookiesToolHandler(browserManager, {
        action: 'set',
        name: 'workflow_cookie',
        value: 'workflow_value'
      });

      // Set localStorage
      await storageToolHandler(browserManager, {
        action: 'set',
        type: 'local',
        key: 'workflow_key',
        value: 'workflow_data'
      });

      // Save state
      await stateToolHandler(browserManager, {
        action: 'save',
        path: testStatePath
      });

      // Verify state was saved
      const showResult = await stateToolHandler(browserManager, {
        action: 'show',
        path: testStatePath
      });
      const stateData = JSON.parse(showResult.content[0].text);
      expect(stateData.state.cookies).toBeGreaterThan(0);

      // Clear cookies and storage
      await cookiesToolHandler(browserManager, { action: 'clear' });
      await storageToolHandler(browserManager, {
        action: 'clear',
        type: 'local'
      });

      // Verify cleared
      const cookiesResult = await cookiesToolHandler(browserManager, {
        action: 'get'
      });
      const cookies = JSON.parse(cookiesResult.content[0].text);
      expect(cookies.length).toBe(0);

      // Clean up
      await stateToolHandler(browserManager, {
        action: 'clear',
        path: testStatePath
      });
    });
  });
});
