import { describe, it, expect, afterEach, beforeAll } from 'vitest';
import { chromium, type Browser as PlaywrightBrowser } from 'playwright-core';
import { BrowserManager } from '../src/browser/manager.js';
import { diffTool } from '../src/tools/advanced/diff.js';
import { dialogTool } from '../src/tools/advanced/dialog.js';
import { frameTool } from '../src/tools/advanced/frame.js';
import { mouseTool } from '../src/tools/advanced/mouse.js';
import { writeFile, unlink, mkdir } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

describe('Advanced Tools Integration Tests', () => {
  let browserManager: BrowserManager;
  let playwrightBrowser: PlaywrightBrowser;
  const tempDir = path.join(os.tmpdir(), `mcp-advanced-test-${Date.now()}`);

  beforeAll(async () => {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });
  });

  afterEach(async () => {
    if (browserManager?.isLaunched()) {
      await browserManager.close();
    }
  });

  describe('browser_diff - snapshot comparison', () => {
    it('should compare current snapshot with stored baseline', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Take initial snapshot
      const snapshot1 = await browserManager.getSnapshot();

      // Modify page
      await page.setContent('<html><body><h1>New Content</h1></body></html>');

      // Compare with baseline
      const result = await diffTool(browserManager, {
        type: 'snapshot',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Snapshot Diff');
      expect(result.content[0].text).toContain('Additions');
      expect(result.content[0].text).toContain('Deletions');
    });

    it('should compare snapshots from file', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Save baseline
      const baselinePath = path.join(tempDir, 'baseline.txt');
      const snapshot1 = await browserManager.getSnapshot();
      await writeFile(baselinePath, snapshot1.tree);

      // Modify page
      await page.setContent('<html><body><button id="test">Click Me</button></body></html>');

      // Compare with file baseline
      const result = await diffTool(browserManager, {
        type: 'snapshot',
        baseline: baselinePath,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Snapshot Diff');

      // Cleanup
      await unlink(baselinePath);
    });

    it('should compare two URLs', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      // Create two different pages to compare
      const result = await diffTool(browserManager, {
        type: 'url',
        url1: 'about:blank',
        url2: 'data:text/html,<html><body><h1>Different</h1></body></html>',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('URL Diff');
      expect(result.content[0].text).toContain('about:blank');
    });

    it('should compare screenshots', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Save baseline screenshot
      const baselinePath = path.join(tempDir, 'baseline.png');
      const screenshot1 = await page.screenshot();
      await writeFile(baselinePath, screenshot1);

      // Modify page
      await page.setContent('<html><body><h1>Changed</h1></body></html>');

      // Compare screenshots
      const result = await diffTool(browserManager, {
        type: 'screenshot',
        baseline: baselinePath,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Screenshot Diff');
      expect(result.content[0].text).toContain('Identical:');

      // Cleanup
      await unlink(baselinePath);
    });
  });

  describe('browser_dialog - handle JavaScript dialogs', () => {
    it('should set up accept handler', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await dialogTool(browserManager, {
        action: 'accept',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('accept next dialog');
    });

    it('should set up accept handler with prompt text', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await dialogTool(browserManager, {
        action: 'accept',
        promptText: 'Test Input',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Test Input');
    });

    it('should set up dismiss handler', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await dialogTool(browserManager, {
        action: 'dismiss',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('dismiss next dialog');
    });

    it('should handle actual alert dialog', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Set up dialog handler
      await dialogTool(browserManager, {
        action: 'accept',
      });

      // Trigger alert and wait for it
      const dialogPromise = page.waitForEvent('dialog');
      await page.evaluate(() => {
        // Small delay to ensure handler is set
        return new Promise((resolve) => {
          setTimeout(() => {
            alert('Test');
            resolve(undefined);
          }, 50);
        });
      });
      const dialog = await dialogPromise;
      await dialog.accept();

      expect(dialog.message()).toBe('Test');
    });

    it('should handle prompt dialog with text', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Set up dialog handler with prompt text
      await dialogTool(browserManager, {
        action: 'accept',
        promptText: 'My Response',
      });

      // Trigger prompt
      const dialogPromise = page.waitForEvent('dialog');
      await page.evaluate(() => prompt('Enter text:'));
      const dialog = await dialogPromise;
      await dialog.accept('My Response');

      expect(dialog.type()).toBe('prompt');
    });
  });

  describe('browser_frame - iframe switching', () => {
    it('should switch to iframe by selector', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Create page with iframe
      await page.setContent(`
        <html>
          <body>
            <iframe id="test-frame" src="data:text/html,<html><body><h1>Inside Frame</h1></body></html>"></iframe>
          </body>
        </html>
      `);

      // Switch to iframe
      const result = await frameTool(browserManager, {
        action: 'switch',
        selector: '#test-frame',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('test-frame');
    });

    it('should switch back to main frame', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Create page with iframe
      await page.setContent(`
        <html>
          <body>
            <h1>Main Page</h1>
            <iframe id="test-frame" src="data:text/html,<html><body><h1>Frame</h1></body></html>"></iframe>
          </body>
        </html>
      `);

      // Switch to iframe
      await frameTool(browserManager, {
        action: 'switch',
        selector: '#test-frame',
      });

      // Switch back to main
      const result = await frameTool(browserManager, {
        action: 'main',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('main frame');
    });

    it('should interact with elements inside iframe', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      // Create page with iframe containing a button
      await page.setContent(`
        <html>
          <body>
            <iframe id="test-frame" src="data:text/html,<html><body><button id='frame-btn'>Click Me</button></body></html>"></iframe>
          </body>
        </html>
      `);

      // Switch to iframe
      await frameTool(browserManager, {
        action: 'switch',
        selector: '#test-frame',
      });

      // Get the frame and verify we can access elements
      const frame = page.frame('#test-frame');
      expect(frame).not.toBeNull();

      if (frame) {
        const button = await frame.$('#frame-btn');
        expect(button).not.toBeNull();
      }
    });

    it('should error when switching to non-existent frame', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();
      await page.goto('about:blank');

      const result = await frameTool(browserManager, {
        action: 'switch',
        selector: '#non-existent-frame',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Frame not found');
    });
  });

  describe('browser_mouse - precise mouse control', () => {
    it('should move mouse to coordinates', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await mouseTool(browserManager, {
        action: 'move',
        x: 100,
        y: 200,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('(100, 200)');
    });

    it('should press mouse button', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await mouseTool(browserManager, {
        action: 'down',
        button: 'left',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Pressed left');
    });

    it('should release mouse button', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await mouseTool(browserManager, {
        action: 'up',
        button: 'left',
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('Released left');
    });

    it('should scroll mouse wheel', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await mouseTool(browserManager, {
        action: 'wheel',
        deltaY: 100,
      });

      expect(result.isError).toBeFalsy();
      expect(result.content[0].text).toContain('deltaY: 100');
    });

    it('should support right and middle mouse buttons', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const rightResult = await mouseTool(browserManager, {
        action: 'down',
        button: 'right',
      });

      const middleResult = await mouseTool(browserManager, {
        action: 'down',
        button: 'middle',
      });

      expect(rightResult.isError).toBeFalsy();
      expect(rightResult.content[0].text).toContain('right');

      expect(middleResult.isError).toBeFalsy();
      expect(middleResult.content[0].text).toContain('middle');
    });

    it('should require coordinates for move action', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const result = await mouseTool(browserManager, {
        action: 'move',
      });

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('x and y coordinates are required');
    });
  });

  describe('Combined workflow tests', () => {
    it('should handle dialog then interact with iframe', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      const page = browserManager.getPage();

      // Create page with iframe
      await page.setContent(`
        <html>
          <body>
            <button onclick="prompt('Enter name:')">Click Me</button>
            <iframe id="test-frame" src="data:text/html,<html><body><h1>Frame Content</h1></body></html>"></iframe>
          </body>
        </html>
      `);

      // Set up dialog handler
      await dialogTool(browserManager, {
        action: 'accept',
        promptText: 'John Doe',
      });

      // Switch to iframe
      const frameResult = await frameTool(browserManager, {
        action: 'switch',
        selector: '#test-frame',
      });

      expect(frameResult.isError).toBeFalsy();

      // Switch back to main
      const mainResult = await frameTool(browserManager, {
        action: 'main',
      });

      expect(mainResult.isError).toBeFalsy();
    });

    it('should use mouse to simulate drag operation', async () => {
      browserManager = new BrowserManager();
      await browserManager.launch({ headless: true });

      // Simulate drag: move, down, move, up
      const move1 = await mouseTool(browserManager, {
        action: 'move',
        x: 100,
        y: 100,
      });

      const down = await mouseTool(browserManager, {
        action: 'down',
        button: 'left',
      });

      const move2 = await mouseTool(browserManager, {
        action: 'move',
        x: 200,
        y: 200,
      });

      const up = await mouseTool(browserManager, {
        action: 'up',
        button: 'left',
      });

      expect(move1.isError).toBeFalsy();
      expect(down.isError).toBeFalsy();
      expect(move2.isError).toBeFalsy();
      expect(up.isError).toBeFalsy();
    });
  });
});
