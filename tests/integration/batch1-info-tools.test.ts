/**
 * Integration Test for Batch 1: Information Retrieval Tools
 *
 * This test validates:
 * - browser_find: Semantic locator with actions
 * - browser_get: Unified information retrieval
 * - browser_is: State checking
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { handleSnapshot } from '../../src/tools/discovery/snapshot.js';
import { findToolHandler } from '../../src/tools/finder/find.js';
import { getToolHandler } from '../../src/tools/info/get.js';
import { isToolHandler } from '../../src/tools/info/is.js';
import { closeTool } from '../../src/tools/navigation/close.js';

describe('Batch 1: Information Retrieval Tools Integration Test', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({
      headless: true,
      browser: 'chromium',
    });
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

  describe('browser_find', () => {
    it('should find element by text and get text content', async () => {
      const result = await findToolHandler(browserManager, {
        locator: 'text Example Domain',
        action: 'text'
      });

      expect(result.content[0].text).toContain('Example Domain');
    });

    it('should find element by role and click', async () => {
      const result = await findToolHandler(browserManager, {
        locator: 'role link',
        action: 'click'
      });

      expect(result.content[0].text).toContain('executed successfully');
    });

    it('should handle invalid locator type gracefully', async () => {
      await expect(findToolHandler(browserManager, {
        locator: 'invalid type value',
        action: 'click'
      })).rejects.toThrow();
    });
  });

  describe('browser_get', () => {
    it('should get page URL', async () => {
      await navigateTool(browserManager, { url: 'https://example.com' });
      const result = await getToolHandler(browserManager, {
        property: 'url'
      });

      expect(result.content[0].text).toContain('example.com');
    });

    it('should get page title', async () => {
      const result = await getToolHandler(browserManager, {
        property: 'title'
      });

      expect(result.content[0].text).toBe('Example Domain');
    });

    it('should get element text using ref', async () => {
      // First get a snapshot to generate refs
      await handleSnapshot(browserManager, {});

      // Get text from the first heading
      const refMap = browserManager.getRefMap();
      const firstRef = Object.keys(refMap)[0];

      const result = await getToolHandler(browserManager, {
        property: 'text',
        ref: firstRef
      });

      expect(result.content[0].text).toBeTruthy();
    });

    it('should get element text using selector', async () => {
      const result = await getToolHandler(browserManager, {
        property: 'text',
        selector: 'h1'
      });

      expect(result.content[0].text).toBe('Example Domain');
    });

    it('should count elements', async () => {
      const result = await getToolHandler(browserManager, {
        property: 'count',
        selector: 'p'
      });

      expect(parseInt(result.content[0].text)).toBeGreaterThan(0); // example.com has paragraphs
    });

    it('should get element attribute', async () => {
      const result = await getToolHandler(browserManager, {
        property: 'attribute',
        selector: 'h1',
        attr: 'tagName' // tagName is always available
      });

      expect(result.content[0].text).toBeTruthy();
    });
  });

  describe('browser_is', () => {
    it('should check if element is visible', async () => {
      await handleSnapshot(browserManager, {});
      const refMap = browserManager.getRefMap();
      const firstRef = Object.keys(refMap)[0];

      const result = await isToolHandler(browserManager, {
        check: 'visible',
        ref: firstRef
      });

      expect(result.content[0].text).toBe('true');
    });

    it('should check if element is enabled', async () => {
      const result = await isToolHandler(browserManager, {
        check: 'enabled',
        selector: 'a'
      });

      expect(result.content[0].text).toBe('true');
    });

    it('should check if element is hidden', async () => {
      const result = await isToolHandler(browserManager, {
        check: 'hidden',
        selector: 'h1'
      });

      expect(result.content[0].text).toBe('false');
    });

    it('should require ref or selector', async () => {
      await expect(isToolHandler(browserManager, {
        check: 'visible'
      })).rejects.toThrow();
    });
  });

  describe('combined workflow', () => {
    it('should work through find -> get -> is workflow', async () => {
      // Navigate to a known page
      await navigateTool(browserManager, { url: 'https://example.com' });

      // Find an element
      const findResult = await findToolHandler(browserManager, {
        locator: 'text Example Domain',
        action: 'text'
      });
      expect(findResult.content[0].text).toContain('Example Domain');

      // Get element info
      const getResult = await getToolHandler(browserManager, {
        property: 'text',
        selector: 'h1'
      });
      expect(getResult.content[0].text).toBe('Example Domain');

      // Check element state
      const isResult = await isToolHandler(browserManager, {
        check: 'visible',
        selector: 'h1'
      });
      expect(isResult.content[0].text).toBe('true');
    });
  });
});
