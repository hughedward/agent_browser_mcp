/**
 * Integration Test for P2: Debug and Diagnostics Tools
 *
 * This test validates:
 * - browser_console: View and clear console messages
 * - browser_errors: View and clear page errors
 * - browser_trace: Start/stop CDP tracing
 * - browser_evaluate: Execute JavaScript in page context
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { consoleToolHandler } from '../../src/tools/debug/console.js';
import { errorsToolHandler } from '../../src/tools/debug/errors.js';
import { traceToolHandler } from '../../src/tools/debug/trace.js';
import { evaluateToolHandler } from '../../src/tools/debug/evaluate.js';
import { closeTool } from '../../src/tools/navigation/close.js';
import { existsSync, unlinkSync } from 'node:fs';

describe('P2: Debug and Diagnostics Tools Integration Test', () => {
  let browserManager: BrowserManager;

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({
      headless: true,
      browser: 'chromium',
    });

    // Start console and error tracking (automatically started by setupPageTracking)
    // These are already tracked by the manager
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

  describe('browser_console - view action', () => {
    it('should view all console messages', async () => {
      const result = await consoleToolHandler(browserManager, {
        action: 'view'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.messages)).toBe(true);

      // Verify message structure
      if (data.messages.length > 0) {
        const message = data.messages[0];
        expect(message).toHaveProperty('type');
        expect(message).toHaveProperty('text');
        expect(message).toHaveProperty('timestamp');
      }
    });

    it('should filter console messages by type', async () => {
      const result = await consoleToolHandler(browserManager, {
        action: 'view',
        types: ['log', 'error']
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.types).toEqual(['log', 'error']);

      // All returned messages should be of the specified types
      if (data.messages.length > 0) {
        data.messages.forEach((message: any) => {
          expect(['log', 'error']).toContain(message.type);
        });
      }
    });

    it('should filter console messages by text', async () => {
      const result = await consoleToolHandler(browserManager, {
        action: 'view',
        filter: 'example'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.filter).toBe('example');

      // All messages should contain the filter text
      if (data.messages.length > 0) {
        data.messages.forEach((message: any) => {
          expect(message.text.toLowerCase()).toContain('example');
        });
      }
    });

    it('should view and clear console messages', async () => {
      // Generate some console output by evaluating code
      await evaluateToolHandler(browserManager, {
        code: 'console.log("Test message 1"); console.log("Test message 2");'
      });

      const result = await consoleToolHandler(browserManager, {
        action: 'view',
        clear: true
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.cleared).toBe(true);

      // Verify messages were cleared
      const afterClear = await consoleToolHandler(browserManager, {
        action: 'view'
      });
      const afterClearData = JSON.parse(afterClear.content[0].text);
      expect(afterClearData.count).toBe(0);
    });
  });

  describe('browser_console - clear action', () => {
    it('should clear all console messages', async () => {
      // Generate some console output
      await evaluateToolHandler(browserManager, {
        code: 'console.log("Before clear");'
      });

      const result = await consoleToolHandler(browserManager, {
        action: 'clear'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('browser_errors - view action', () => {
    it('should view all page errors', async () => {
      const result = await errorsToolHandler(browserManager, {
        action: 'view'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(data.errors)).toBe(true);

      // Verify error structure
      if (data.errors.length > 0) {
        const error = data.errors[0];
        expect(error).toHaveProperty('message');
        expect(error).toHaveProperty('timestamp');
      }
    });

    it('should filter errors by text', async () => {
      const result = await errorsToolHandler(browserManager, {
        action: 'view',
        filter: 'undefined'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.filter).toBe('undefined');

      // All errors should contain the filter text
      if (data.errors.length > 0) {
        data.errors.forEach((error: any) => {
          expect(error.message.toLowerCase()).toContain('undefined');
        });
      }
    });

    it('should view and clear errors', async () => {
      const result = await errorsToolHandler(browserManager, {
        action: 'view',
        clear: true
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.cleared).toBe(true);

      // Verify errors were cleared
      const afterClear = await errorsToolHandler(browserManager, {
        action: 'view'
      });
      const afterClearData = JSON.parse(afterClear.content[0].text);
      expect(afterClearData.count).toBe(0);
    });
  });

  describe('browser_errors - clear action', () => {
    it('should clear all errors', async () => {
      const result = await errorsToolHandler(browserManager, {
        action: 'clear'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('browser_evaluate - basic expressions', () => {
    it('should evaluate simple expression', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: '1 + 1'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBe(2);
      expect(data.type).toBe('number');
    });

    it('should get document title', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'document.title'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBeTruthy();
      expect(data.type).toBe('string');
    });

    it('should get current URL', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'window.location.href'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toContain('http');
      expect(data.type).toBe('string');
    });

    it('should execute multiple statements', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'var x = 10; var y = 20; x + y'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBe(30);
    });

    it('should handle undefined result', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'void 0'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBeUndefined();
      expect(data.type).toBe('undefined');
    });

    it('should handle null result', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'null'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBeNull();
      expect(data.type).toBe('null');
    });
  });

  describe('browser_evaluate - DOM manipulation', () => {
    it('should count elements', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'document.querySelectorAll("div").length'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBeGreaterThanOrEqual(0);
      expect(data.type).toBe('number');
    });

    it('should get element text content', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'document.querySelector("h1")?.textContent'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      // Result might be null if no h1 found
      expect(data.result === null || typeof data.result === 'string').toBe(true);
    });

    it('should check if element exists', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: '!!document.querySelector("h1")'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(typeof data.result).toBe('boolean');
    });

    it('should get localStorage keys count', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'Object.keys(localStorage).length'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.result).toBeGreaterThanOrEqual(0);
    });
  });

  describe('browser_evaluate - error handling', () => {
    it('should handle syntax errors gracefully', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'invalid javascript here!!!'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });

    it('should handle runtime errors gracefully', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'throw new Error("Test error")'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toContain('Test error');
    });

    it('should handle reference errors gracefully', async () => {
      const result = await evaluateToolHandler(browserManager, {
        code: 'nonExistentVariable'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.error).toBeTruthy();
    });
  });

  describe('browser_trace - status action', () => {
    it('should check tracing status', async () => {
      const result = await traceToolHandler(browserManager, {
        action: 'status'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.active).toBe(false);
    });
  });

  describe('browser_trace - start/stop actions', () => {
    const tracePath = '/tmp/test-trace.zip';

    afterEach(() => {
      // Clean up trace file if it exists
      if (existsSync(tracePath)) {
        try {
          unlinkSync(tracePath);
        } catch {
          // Ignore cleanup errors
        }
      }
    });

    it('should start tracing', async () => {
      const result = await traceToolHandler(browserManager, {
        action: 'start'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.active).toBe(true);

      // Verify tracing is active
      const statusResult = await traceToolHandler(browserManager, {
        action: 'status'
      });
      const statusData = JSON.parse(statusResult.content[0].text);
      expect(statusData.active).toBe(true);
    });

    it('should fail to start tracing when already active', async () => {
      // Start tracing
      await traceToolHandler(browserManager, {
        action: 'start'
      });

      // Try to start again
      const result = await traceToolHandler(browserManager, {
        action: 'start'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.active).toBe(true);
    });

    it('should stop tracing and save to zip file', async () => {
      // Start tracing
      await traceToolHandler(browserManager, {
        action: 'start'
      });

      // Do some work to generate trace events
      await navigateTool(browserManager, { url: 'https://example.com' });
      await evaluateToolHandler(browserManager, {
        code: 'console.log("Test message for trace");'
      });

      // Stop tracing and save
      const result = await traceToolHandler(browserManager, {
        action: 'stop',
        path: tracePath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.path).toBe(tracePath);
      expect(data.eventCount).toBeGreaterThan(0);
      expect(parseFloat(data.sizeMB)).toBeGreaterThan(0);

      // Verify file was created
      expect(existsSync(tracePath)).toBe(true);

      // Verify tracing is no longer active
      const statusResult = await traceToolHandler(browserManager, {
        action: 'status'
      });
      const statusData = JSON.parse(statusResult.content[0].text);
      expect(statusData.active).toBe(false);
    });

    it('should fail to stop when not tracing', async () => {
      const result = await traceToolHandler(browserManager, {
        action: 'stop',
        path: tracePath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.active).toBe(false);
    });

    it('should require path for stop action', async () => {
      await traceToolHandler(browserManager, {
        action: 'start'
      });

      await expect(traceToolHandler(browserManager, {
        action: 'stop'
      })).rejects.toThrow();
    });

    it('should validate .zip extension', async () => {
      await traceToolHandler(browserManager, {
        action: 'start'
      });

      await expect(traceToolHandler(browserManager, {
        action: 'stop',
        path: '/tmp/test-trace.json'
      })).rejects.toThrow();
    });
  });

  describe('Debug tools workflow', () => {
    it('should work together: console, evaluate, errors', async () => {
      // Generate console output and errors
      await evaluateToolHandler(browserManager, {
        code: 'console.log("Workflow test"); console.error("Test error");'
      });

      // Check console
      const consoleResult = await consoleToolHandler(browserManager, {
        action: 'view',
        types: ['log']
      });
      const consoleData = JSON.parse(consoleResult.content[0].text);
      expect(consoleData.count).toBeGreaterThan(0);

      // Check errors (console.error doesn't create page errors, so we check console for error type)
      const consoleErrorResult = await consoleToolHandler(browserManager, {
        action: 'view',
        types: ['error']
      });
      const consoleErrorData = JSON.parse(consoleErrorResult.content[0].text);
      expect(consoleErrorData.count).toBeGreaterThan(0);

      // Cleanup
      await consoleToolHandler(browserManager, { action: 'clear' });
      await errorsToolHandler(browserManager, { action: 'clear' });
    });
  });
});
