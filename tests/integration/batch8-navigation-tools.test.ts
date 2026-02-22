/**
 * Integration Test for Batch 8: Supplementary Navigation Tools
 *
 * This test validates:
 * - browser_back: Navigate back in history
 * - browser_forward: Navigate forward in history
 * - browser_reload: Reload the current page
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { backTool } from '../../src/tools/navigation/back.js';
import { forwardTool } from '../../src/tools/navigation/forward.js';
import { reloadTool } from '../../src/tools/navigation/reload.js';
import { getToolHandler } from '../../src/tools/info/get.js';
import { closeTool } from '../../src/tools/navigation/close.js';

describe('Batch 8: Supplementary Navigation Tools Integration Test', () => {
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

  describe('navigation history setup', () => {
    it('should navigate to first page (example.com)', async () => {
      const result = await navigateTool(browserManager, {
        url: 'https://example.com',
      });
      expect(result.isError).not.toBe(true);

      // Verify URL
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.com');
    });

    it('should navigate to second page (example.org)', async () => {
      const result = await navigateTool(browserManager, {
        url: 'https://example.org',
      });
      expect(result.isError).not.toBe(true);

      // Verify URL
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');
    });

    it('should navigate to third page (example.net)', async () => {
      const result = await navigateTool(browserManager, {
        url: 'https://example.net',
      });
      expect(result.isError).not.toBe(true);

      // Verify URL
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.net');
    });
  });

  describe('browser_back', () => {
    it('should navigate back to example.org', async () => {
      const result = await backTool(browserManager);
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated back');

      // Verify URL changed to example.org
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');
    });

    it('should navigate back to example.com', async () => {
      const result = await backTool(browserManager);
      expect(result.isError).not.toBe(true);

      // Verify URL changed to example.com
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.com');
    });

    it('should handle navigating back with no history gracefully', async () => {
      // We're at the first page, so going back does nothing
      const result = await backTool(browserManager);
      // Playwright doesn't throw an error, it just does nothing
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated back');
    });
  });

  describe('browser_forward', () => {
    it('should navigate forward to example.org', async () => {
      // Setup: navigate forward again to create forward history
      await navigateTool(browserManager, { url: 'https://example.com' });
      await navigateTool(browserManager, { url: 'https://example.org' });
      await navigateTool(browserManager, { url: 'https://example.net' });

      // Go back twice to create forward history
      await backTool(browserManager); // now on example.org
      await backTool(browserManager); // now on example.com

      const result = await forwardTool(browserManager);
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated forward');

      // Verify URL changed to example.org
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');
    });

    it('should navigate forward to example.net', async () => {
      const result = await forwardTool(browserManager);
      expect(result.isError).not.toBe(true);

      // Verify URL changed to example.net
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.net');
    });

    it('should handle navigating forward with no history gracefully', async () => {
      // We're at the most recent page, so going forward does nothing
      const result = await forwardTool(browserManager);
      // Playwright doesn't throw an error, it just does nothing
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated forward');
    });
  });

  describe('browser_reload', () => {
    it('should reload the current page', async () => {
      // Navigate to a known page
      await navigateTool(browserManager, { url: 'https://example.com' });

      const result = await reloadTool(browserManager);
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Page reloaded');

      // Verify we're still on the same page
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.com');
    });

    it('should reload with custom waitUntil option', async () => {
      const result = await reloadTool(browserManager, {
        waitUntil: 'domcontentloaded',
      });
      expect(result.isError).not.toBe(true);

      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.com');
    });

    it('should reload and preserve page content', async () => {
      // Get title before reload
      const titleBefore = await getToolHandler(browserManager, {
        property: 'title',
      });

      // Reload
      await reloadTool(browserManager);

      // Get title after reload
      const titleAfter = await getToolHandler(browserManager, {
        property: 'title',
      });

      // Titles should match
      expect(titleBefore.content[0].text).toBe(titleAfter.content[0].text);
    });
  });

  describe('combined navigation workflow', () => {
    it('should navigate through history: back -> forward -> reload', async () => {
      // Setup: navigate to multiple pages
      await navigateTool(browserManager, { url: 'https://example.com' });
      await navigateTool(browserManager, { url: 'https://example.org' });
      await navigateTool(browserManager, { url: 'https://example.net' });

      // Should be on example.net
      let urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.net');

      // Go back twice
      await backTool(browserManager);
      await backTool(browserManager);

      // Should be on example.com
      urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.com');

      // Go forward once
      await forwardTool(browserManager);

      // Should be on example.org
      urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');

      // Reload current page
      await reloadTool(browserManager);

      // Should still be on example.org
      urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');
    });

    it('should handle complex navigation sequence', async () => {
      // Start fresh
      await navigateTool(browserManager, { url: 'https://example.com' });
      await navigateTool(browserManager, { url: 'https://example.org' });

      // Go back
      let result = await backTool(browserManager);
      expect(result.isError).not.toBe(true);

      // Reload
      result = await reloadTool(browserManager);
      expect(result.isError).not.toBe(true);

      // Go forward
      result = await forwardTool(browserManager);
      expect(result.isError).not.toBe(true);

      // Verify final state
      const urlResult = await getToolHandler(browserManager, {
        property: 'url',
      });
      expect(urlResult.content[0].text).toContain('example.org');
    });
  });

  describe('error handling', () => {
    it('should handle back() with no history gracefully', async () => {
      // Navigate to a fresh page with no back history
      await navigateTool(browserManager, { url: 'https://example.com' });

      // Try to go back - Playwright doesn't error, just does nothing
      const result = await backTool(browserManager);
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated back');
    });

    it('should handle forward() with no history gracefully', async () => {
      // Navigate to a new page - no forward history available
      await navigateTool(browserManager, { url: 'https://example.com' });

      // Try to go forward - Playwright doesn't error, just does nothing
      const result = await forwardTool(browserManager);
      expect(result.isError).not.toBe(true);
      expect(result.content[0].text).toContain('Navigated forward');
    });

    it('should handle reload() error gracefully', async () => {
      // Navigate to a valid page
      await navigateTool(browserManager, { url: 'https://example.com' });

      // Reload should succeed
      const result = await reloadTool(browserManager);
      expect(result.isError).not.toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle rapid back/forward navigation', async () => {
      // Create history
      await navigateTool(browserManager, { url: 'https://example.com' });
      await navigateTool(browserManager, { url: 'https://example.org' });
      await navigateTool(browserManager, { url: 'https://example.net' });

      // Rapid back navigation
      const back1 = await backTool(browserManager);
      const back2 = await backTool(browserManager);

      expect(back1.isError).not.toBe(true);
      expect(back2.isError).not.toBe(true);

      // Rapid forward navigation
      const forward1 = await forwardTool(browserManager);
      const forward2 = await forwardTool(browserManager);

      expect(forward1.isError).not.toBe(true);
      expect(forward2.isError).not.toBe(true);
    });

    it('should handle reload with different wait conditions', async () => {
      await navigateTool(browserManager, { url: 'https://example.com' });

      const load = await reloadTool(browserManager, { waitUntil: 'load' });
      const dcl = await reloadTool(browserManager, {
        waitUntil: 'domcontentloaded',
      });

      expect(load.isError).not.toBe(true);
      expect(dcl.isError).not.toBe(true);
    });
  });
});
