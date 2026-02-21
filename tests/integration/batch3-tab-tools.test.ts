/**
 * Integration Test for Batch 3: Tab and Window Management Tools
 *
 * This test validates:
 * - browser_tab: List, new, switch, and close tabs
 * - browser_window: Create new browser windows
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { tabTool } from '../../src/tools/tabs/tab.js';
import { windowTool } from '../../src/tools/tabs/window.js';
import { closeTool } from '../../src/tools/navigation/close.js';

describe('Batch 3: Tab and Window Management Tools Integration Test', () => {
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

  it('should navigate initial tab to test page', async () => {
    const result = await navigateTool(browserManager, { url: 'https://example.com' });
    expect(result.isError).not.toBe(true);
  });

  describe('browser_tab', () => {
    describe('list action', () => {
      it('should list all tabs', async () => {
        const result = await tabTool(browserManager, { action: 'list' });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Tabs (1 total');
        expect(text).toContain('[0]');
        expect(text).toContain('example.com');
        expect(text).toContain('current tab:');
      });

      it('should show current tab index', async () => {
        const result = await tabTool(browserManager, { action: 'list' });

        const text = result.content[0].text;
        expect(text).toContain('current tab: 0');
      });
    });

    describe('new action', () => {
      it('should create a new tab', async () => {
        const result = await tabTool(browserManager, { action: 'new' });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Created new tab [1]');
        expect(text).toContain('2 total tabs');

        // Verify the new tab is active
        expect(browserManager.getActiveIndex()).toBe(1);
      });

      it('should create a new tab with URL', async () => {
        const result = await tabTool(browserManager, {
          action: 'new',
          url: 'https://example.org'
        });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Created new tab [2]');
        expect(text).toContain('3 total tabs');
        expect(text).toContain('https://example.org');

        // Verify navigation
        const page = browserManager.getPage();
        expect(page.url()).toContain('example.org');
      });

      it('should list multiple tabs', async () => {
        const result = await tabTool(browserManager, { action: 'list' });

        const text = result.content[0].text;
        expect(text).toContain('Tabs (3 total');
        expect(text).toContain('[0]');
        expect(text).toContain('[1]');
        expect(text).toContain('[2]');
      });
    });

    describe('switch action', () => {
      it('should switch to a specific tab by index', async () => {
        const result = await tabTool(browserManager, {
          action: 'switch',
          index: 0
        });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Switched to tab [0]');

        // Verify the active tab changed
        expect(browserManager.getActiveIndex()).toBe(0);

        // Verify we're on the correct page
        const page = browserManager.getPage();
        expect(page.url()).toContain('example.com');
      });

      it('should switch between multiple tabs', async () => {
        // Switch to tab 2
        let result = await tabTool(browserManager, {
          action: 'switch',
          index: 2
        });

        expect(result.content[0].text).toContain('Switched to tab [2]');
        expect(browserManager.getActiveIndex()).toBe(2);

        // Switch to tab 1
        result = await tabTool(browserManager, {
          action: 'switch',
          index: 1
        });

        expect(result.content[0].text).toContain('Switched to tab [1]');
        expect(browserManager.getActiveIndex()).toBe(1);
      });

      it('should require index for switch action', async () => {
        const result = await tabTool(browserManager, {
          action: 'switch'
        } as any);

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('index is required');
      });

      it('should handle invalid tab index', async () => {
        const result = await tabTool(browserManager, {
          action: 'switch',
          index: 999
        });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Invalid tab index');
      });
    });

    describe('close action', () => {
      it('should close current tab by default', async () => {
        // First switch to tab 2
        await tabTool(browserManager, {
          action: 'switch',
          index: 2
        });

        // Close current tab (tab 2)
        const result = await tabTool(browserManager, { action: 'close' });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Closed tab [2]');
        expect(text).toContain('2 tabs remaining');

        // Verify we have 2 tabs left
        const listResult = await tabTool(browserManager, { action: 'list' });
        expect(listResult.content[0].text).toContain('Tabs (2 total');
      });

      it('should close specific tab by index', async () => {
        // Close tab 1
        const result = await tabTool(browserManager, {
          action: 'close',
          index: 1
        });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Closed tab [1]');
        expect(text).toContain('1 tabs remaining');

        // Verify we have 1 tab left
        const listResult = await tabTool(browserManager, { action: 'list' });
        expect(listResult.content[0].text).toContain('Tabs (1 total');
      });

      it('should not close the last tab', async () => {
        // Try to close the last tab
        const result = await tabTool(browserManager, { action: 'close' });

        expect(result.isError).toBe(true);
        expect(result.content[0].text).toContain('Cannot close the last tab');
      });
    });
  });

  describe('browser_window', () => {
    describe('new action', () => {
      it('should create a new window', async () => {
        const result = await windowTool(browserManager, {
          action: 'new'
        });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Created new window');
        expect(text).toContain('tab [1]');
        expect(text).toContain('2 total tabs');

        // Verify we have 2 tabs
        expect(browserManager.getPages().length).toBe(2);
      });

      it('should create a new window with custom viewport', async () => {
        const result = await windowTool(browserManager, {
          action: 'new',
          viewport: { width: 1920, height: 1080 }
        });

        expect(result.content[0].type).toBe('text');
        expect(result.isError).not.toBe(true);

        const text = result.content[0].text;
        expect(text).toContain('Created new window');
        expect(text).toContain('1920x1080');

        // Verify viewport size
        const page = browserManager.getPage();
        const viewport = page.viewportSize();
        expect(viewport?.width).toBe(1920);
        expect(viewport?.height).toBe(1080);
      });

      it('should have isolated contexts for different windows', async () => {
        // Navigate first tab to example.com
        await tabTool(browserManager, { action: 'switch', index: 0 });
        await navigateTool(browserManager, { url: 'https://example.com' });

        const page0 = browserManager.getPage();
        expect(page0.url()).toContain('example.com');

        // Create new window
        await windowTool(browserManager, { action: 'new' });

        // The new window creates a new tab at the end
        const newIndex = browserManager.getPages().length - 1;

        // Navigate the new window to example.org
        await navigateTool(browserManager, { url: 'https://example.org' });

        const pageNew = browserManager.getPage();
        expect(pageNew.url()).toContain('example.org');

        // Switch back to first tab
        await tabTool(browserManager, { action: 'switch', index: 0 });

        // Verify first tab is still on example.com
        const page0Again = browserManager.getPage();
        expect(page0Again.url()).toContain('example.com');

        // Switch to the new window tab
        await tabTool(browserManager, { action: 'switch', index: newIndex });

        // Verify it's still on example.org
        const pageNewAgain = browserManager.getPage();
        expect(pageNewAgain.url()).toContain('example.org');
      });
    });
  });

  describe('combined workflow', () => {
    it('should work through multi-tab navigation workflow', async () => {
      // Get current tab count
      const initialCount = browserManager.getPages().length;

      // Create multiple new tabs
      await tabTool(browserManager, { action: 'new', url: 'https://example.com' });
      await tabTool(browserManager, { action: 'new', url: 'https://example.org' });
      await tabTool(browserManager, { action: 'new', url: 'https://example.net' });

      // Verify we have 3 more tabs
      const listResult = await tabTool(browserManager, { action: 'list' });
      expect(listResult.content[0].text).toContain(`Tabs (${initialCount + 3} total`);

      // Navigate between the newly created tabs (they're at the end)
      const lastIndex = browserManager.getPages().length - 1;

      await tabTool(browserManager, { action: 'switch', index: lastIndex });
      expect(browserManager.getPage().url()).toContain('example.net');

      await tabTool(browserManager, { action: 'switch', index: lastIndex - 1 });
      expect(browserManager.getPage().url()).toContain('example.org');

      await tabTool(browserManager, { action: 'switch', index: lastIndex - 2 });
      expect(browserManager.getPage().url()).toContain('example.com');

      // Close the last tab
      await tabTool(browserManager, { action: 'close', index: lastIndex });

      // Verify we have one less tab
      const finalListResult = await tabTool(browserManager, { action: 'list' });
      expect(finalListResult.content[0].text).toContain(`Tabs (${initialCount + 2} total`);
    });

    it('should work with tabs and windows together', async () => {
      // Start fresh - close all but first tab
      await tabTool(browserManager, { action: 'switch', index: 0 });
      while (browserManager.getPages().length > 1) {
        await tabTool(browserManager, { action: 'close', index: 1 });
      }

      // Create tabs
      await tabTool(browserManager, { action: 'new', url: 'https://example.com' });

      // Create window
      await windowTool(browserManager, { action: 'new' });

      // Navigate the window
      await navigateTool(browserManager, { url: 'https://example.org' });

      // List all tabs
      const listResult = await tabTool(browserManager, { action: 'list' });
      expect(listResult.content[0].text).toContain('Tabs (3 total');

      // Switch between them
      await tabTool(browserManager, { action: 'switch', index: 0 });
      await tabTool(browserManager, { action: 'switch', index: 1 });
      await tabTool(browserManager, { action: 'switch', index: 2 });

      // Verify each has correct URL
      await tabTool(browserManager, { action: 'switch', index: 0 });
      expect(browserManager.getPage().url()).toBeTruthy();

      await tabTool(browserManager, { action: 'switch', index: 2 });
      expect(browserManager.getPage().url()).toContain('example.org');
    });
  });

  describe('error handling', () => {
    it('should handle unknown action', async () => {
      const result = await tabTool(browserManager, {
        action: 'unknown' as any
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown action');
    });

    it('should handle window unknown action', async () => {
      const result = await windowTool(browserManager, {
        action: 'unknown' as any
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Unknown action');
    });
  });
});
