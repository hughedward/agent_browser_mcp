/**
 * Integration Test for Batch G: Supplementary Debug Tools
 *
 * This test validates:
 * - browser_highlight: Highlight elements for debugging
 * - browser_profiler: Chrome DevTools profiling
 * - browser_download: Handle downloads
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { highlightToolHandler } from '../../src/tools/debug/highlight.js';
import { profilerToolHandler } from '../../src/tools/debug/profiler.js';
import { downloadToolHandler } from '../../src/tools/advanced/download.js';
import { closeTool } from '../../src/tools/navigation/close.js';
import { unlinkSync, existsSync } from 'node:fs';

describe('Batch G: Supplementary Debug Tools Integration Test', () => {
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

  describe('browser_highlight - highlight action', () => {
    it('should navigate to test page', async () => {
      const result = await navigateTool(browserManager, {
        url: 'https://example.com'
      });
      expect(result.isError).not.toBe(true);
    });

    it('should highlight element by CSS selector', async () => {
      const result = await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'h1',
        color: 'red',
        width: 3
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.color).toBe('red');
      expect(data.width).toBe(3);
    });

    it('should highlight element with custom color', async () => {
      const result = await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'p',
        color: 'blue',
        width: 5
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
      expect(data.color).toBe('blue');
      expect(data.width).toBe(5);
    });

    it('should highlight element with auto-clear duration', async () => {
      const result = await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'h1',
        color: 'green',
        duration: 2000 // 2 seconds
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.duration).toBe('2000ms');
    });

    it('should fail to highlight non-existent element', async () => {
      const result = await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: '.non-existent-element'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.count).toBe(0);
    });

    it('should require element parameter for highlight action', async () => {
      await expect(highlightToolHandler(browserManager, {
        action: 'highlight'
      })).rejects.toThrow();
    });
  });

  describe('browser_highlight - clear action', () => {
    it('should clear all highlights', async () => {
      // First add some highlights
      await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'h1'
      });

      await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'p'
      });

      // Then clear them
      const result = await highlightToolHandler(browserManager, {
        action: 'clear'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThan(0);
    });

    it('should handle clear when no highlights exist', async () => {
      const result = await highlightToolHandler(browserManager, {
        action: 'clear'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBe(0);
    });
  });

  describe('browser_profiler - start action', () => {
    it('should start profiling with default categories', async () => {
      const result = await profilerToolHandler(browserManager, {
        action: 'start'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message).toBe('CPU profiling started');
      expect(data.sessionId).toBeDefined();
      expect(data.categories).toBeDefined();
      expect(Array.isArray(data.categories)).toBe(true);
    });

    it('should start profiling with custom categories', async () => {
      // Make sure no profiling is active
      try {
        await profilerToolHandler(browserManager, {
          action: 'stop'
        });
      } catch (e) {
        // Ignore if not active
      }

      const result = await profilerToolHandler(browserManager, {
        action: 'start',
        categories: ['devtools.timeline', 'v8.execute']
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.categories).toEqual(['devtools.timeline', 'v8.execute']);

      // Clean up
      await profilerToolHandler(browserManager, {
        action: 'stop'
      });
    });

    it('should fail to start profiling when already active', async () => {
      // First start
      await profilerToolHandler(browserManager, {
        action: 'start'
      });

      // Try to start again
      const result = await profilerToolHandler(browserManager, {
        action: 'start'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.message).toContain('already active');
    });
  });

  describe('browser_profiler - stop action', () => {
    it('should stop profiling and save trace file', async () => {
      // Start profiling
      await profilerToolHandler(browserManager, {
        action: 'start'
      });

      // Wait a bit to collect some data
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stop profiling
      const result = await profilerToolHandler(browserManager, {
        action: 'stop'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.message).toBe('Profiling stopped and trace saved');
      expect(data.outputPath).toBeDefined();
      expect(data.fileSize).toBeDefined();
      expect(data.sessionId).toBeDefined();

      // Verify file was created
      const fs = await import('node:fs/promises');
      const exists = await fs.access(data.outputPath).then(() => true).catch(() => false);
      expect(exists).toBe(true);

      // Clean up
      await fs.unlink(data.outputPath).catch(() => {});
    });

    it('should stop profiling and save to custom path', async () => {
      const customPath = `/tmp/test-trace-${Date.now()}.json`;

      // Start profiling
      await profilerToolHandler(browserManager, {
        action: 'start'
      });

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 300));

      // Stop with custom path
      const result = await profilerToolHandler(browserManager, {
        action: 'stop',
        outputPath: customPath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.outputPath).toBe(customPath);

      // Verify file exists
      expect(existsSync(customPath)).toBe(true);

      // Clean up
      unlinkSync(customPath);
    });

    it('should fail to stop when no profiling is active', async () => {
      const result = await profilerToolHandler(browserManager, {
        action: 'stop'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No active profiling session');
    });
  });

  describe('browser_profiler - status action', () => {
    it('should check profiling status when not active', async () => {
      const result = await profilerToolHandler(browserManager, {
        action: 'status'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.isProfiling).toBe(false);
      expect(data.sessionId).toBeNull();
    });

    it('should check profiling status when active', async () => {
      // Start profiling
      await profilerToolHandler(browserManager, {
        action: 'start'
      });

      // Check status
      const result = await profilerToolHandler(browserManager, {
        action: 'status'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.isProfiling).toBe(true);
      expect(data.sessionId).toBeDefined();

      // Clean up - stop profiling
      await profilerToolHandler(browserManager, {
        action: 'stop'
      });
    });
  });

  describe('browser_download - list action', () => {
    it('should list downloads when none exist', async () => {
      const result = await downloadToolHandler(browserManager, {
        action: 'list'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBe(0);
      expect(Array.isArray(data.downloads)).toBe(true);
      expect(data.downloads).toHaveLength(0);
    });
  });

  describe('browser_download - path action', () => {
    it('should return error when no downloads exist', async () => {
      const result = await downloadToolHandler(browserManager, {
        action: 'path'
      });

      expect(result.isError).toBe(true);

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No downloads');
    });
  });

  describe('browser_download - get action', () => {
    it('should return error for invalid download ID', async () => {
      const result = await downloadToolHandler(browserManager, {
        action: 'get',
        id: '999'
      });

      expect(result.isError).toBe(true);

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.message).toContain('not found');
    });

    it('should require ID parameter for get action', async () => {
      const result = await downloadToolHandler(browserManager, {
        action: 'get'
      } as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Download ID is required');
    });
  });

  describe('browser_download - delete action', () => {
    it('should require ID parameter for delete action', async () => {
      const result = await downloadToolHandler(browserManager, {
        action: 'delete'
      } as any);

      expect(result.isError).toBe(true);
      expect(result.content[0].text).toContain('Download ID is required');
    });
  });

  describe('Combined workflow test', () => {
    it('should use highlight, profiler, and download in sequence', async () => {
      // Navigate to a page
      await navigateTool(browserManager, {
        url: 'https://example.com'
      });

      // Highlight some elements
      const highlightResult = await highlightToolHandler(browserManager, {
        action: 'highlight',
        element: 'h1',
        color: 'cyan'
      });
      const highlightData = JSON.parse(highlightResult.content[0].text);
      expect(highlightData.success).toBe(true);

      // Start profiling
      const profilerStartResult = await profilerToolHandler(browserManager, {
        action: 'start'
      });
      const profilerStartData = JSON.parse(profilerStartResult.content[0].text);
      expect(profilerStartData.success).toBe(true);

      // Wait a bit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Stop profiling
      const profilerStopResult = await profilerToolHandler(browserManager, {
        action: 'stop'
      });
      const profilerStopData = JSON.parse(profilerStopResult.content[0].text);
      expect(profilerStopData.success).toBe(true);
      expect(profilerStopData.outputPath).toBeDefined();

      // Clean up trace file
      if (existsSync(profilerStopData.outputPath)) {
        unlinkSync(profilerStopData.outputPath);
      }

      // Clear highlights
      const clearResult = await highlightToolHandler(browserManager, {
        action: 'clear'
      });
      const clearData = JSON.parse(clearResult.content[0].text);
      expect(clearData.success).toBe(true);

      // Check downloads list (should be empty)
      const listResult = await downloadToolHandler(browserManager, {
        action: 'list'
      });
      const listData = JSON.parse(listResult.content[0].text);
      expect(listData.success).toBe(true);
      expect(listData.count).toBe(0);
    });
  });
});
