/**
 * Integration Test for P2: Video Recording Tool
 *
 * This test validates:
 * - browser_record: start, stop, restart actions
 * - Video file creation
 * - Recording state management
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { BrowserManager } from '../../src/browser/manager.js';
import { navigateTool } from '../../src/tools/navigation/navigate.js';
import { recordToolHandler } from '../../src/tools/recording/record.js';
import { closeTool } from '../../src/tools/navigation/close.js';
import * as fs from 'fs';
import * as path from 'path';
import os from 'os';

describe('P2: Video Recording Tool Integration Test', () => {
  let browserManager: BrowserManager;
  let tempDir: string;

  beforeAll(async () => {
    browserManager = new BrowserManager();
    await browserManager.launch({
      headless: true,
      browser: 'chromium',
    });

    // Create temp directory for test recordings
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'record-test-'));
  });

  afterAll(async () => {
    if (browserManager) {
      await browserManager.close();
    }

    // Clean up temp directory
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
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

  describe('browser_record - start action', () => {
    it('should start recording to a file', async () => {
      const outputPath = path.join(tempDir, 'test-start.webm');

      const result = await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.action).toBe('start');
      expect(data.outputPath).toBe(outputPath);
      expect(data.recording).toBe(true);

      // Verify recording state
      expect(browserManager.isRecording()).toBe(true);
    });

    it('should start recording with URL navigation', async () => {
      // Stop previous recording first
      await recordToolHandler(browserManager, { action: 'stop' });

      const outputPath = path.join(tempDir, 'test-with-url.webm');
      const testUrl = 'https://httpbin.org/html';

      const result = await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath,
        url: testUrl
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.currentUrl).toContain('httpbin');

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });

    it('should require path parameter when starting', async () => {
      await expect(recordToolHandler(browserManager, {
        action: 'start'
      }))
        .rejects.toThrow('path is required');
    });

    it('should require .webm extension', async () => {
      const outputPath = path.join(tempDir, 'test.mp4');

      await expect(recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      }))
        .rejects.toThrow('.webm');
    });

    it('should not allow starting recording when already recording', async () => {
      // Start first recording
      const path1 = path.join(tempDir, 'test1.webm');
      await recordToolHandler(browserManager, {
        action: 'start',
        path: path1
      });

      // Try to start another recording
      const path2 = path.join(tempDir, 'test2.webm');
      await expect(recordToolHandler(browserManager, {
        action: 'start',
        path: path2
      }))
        .rejects.toThrow('Recording already in progress');

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });
  });

  describe('browser_record - stop action', () => {
    it('should stop recording and save video file', async () => {
      // Start recording
      const outputPath = path.join(tempDir, 'test-stop.webm');
      await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      });

      // Navigate to generate some video content
      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Stop recording
      const result = await recordToolHandler(browserManager, {
        action: 'stop'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.action).toBe('stop');
      expect(data.outputPath).toBe(outputPath);
      expect(data.recording).toBe(false);

      // Verify video file was created
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify file size is reasonable (> 0 bytes)
      const stats = fs.statSync(outputPath);
      expect(stats.size).toBeGreaterThan(0);
      expect(data.size).toBe(stats.size);
      // Size formatted is like "18.07 KB" - just verify it's not empty
      expect(data.sizeFormatted).toBeTruthy();
      expect(data.sizeFormatted.length).toBeGreaterThan(0);
    });

    it('should handle stop when no recording is active', async () => {
      // Ensure no recording is active
      if (browserManager.isRecording()) {
        await recordToolHandler(browserManager, { action: 'stop' });
      }

      const result = await recordToolHandler(browserManager, {
        action: 'stop'
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(false);
      expect(data.message).toContain('No recording in progress');
      expect(data.recording).toBe(false);
    });
  });

  describe('browser_record - restart action', () => {
    it('should restart recording (stop current and start new)', async () => {
      // Start first recording
      const path1 = path.join(tempDir, 'test-restart-1.webm');
      await recordToolHandler(browserManager, {
        action: 'start',
        path: path1
      });

      // Generate some content
      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 500));

      // Restart with new path
      const path2 = path.join(tempDir, 'test-restart-2.webm');
      const result = await recordToolHandler(browserManager, {
        action: 'restart',
        path: path2
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.action).toBe('restart');
      expect(data.stoppedPrevious).toBe(true);
      expect(data.previousPath).toBe(path1);
      expect(data.outputPath).toBe(path2);
      expect(data.recording).toBe(true);

      // Verify first video file was created
      expect(fs.existsSync(path1)).toBe(true);

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });

    it('should restart with URL navigation', async () => {
      // Start first recording
      const path1 = path.join(tempDir, 'test-restart-url-1.webm');
      await recordToolHandler(browserManager, {
        action: 'start',
        path: path1
      });

      // Restart with new URL
      const path2 = path.join(tempDir, 'test-restart-url-2.webm');
      const newUrl = 'https://httpbin.org/html';

      const result = await recordToolHandler(browserManager, {
        action: 'restart',
        path: path2,
        url: newUrl
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.stoppedPrevious).toBe(true);
      expect(data.currentUrl).toContain('httpbin');

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });

    it('should handle restart when no recording is active', async () => {
      // Ensure no recording is active
      if (browserManager.isRecording()) {
        await recordToolHandler(browserManager, { action: 'stop' });
      }

      const outputPath = path.join(tempDir, 'test-restart-no-prev.webm');

      const result = await recordToolHandler(browserManager, {
        action: 'restart',
        path: outputPath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);
      expect(data.stoppedPrevious).toBe(false);
      expect(data.previousPath).toBe(null);
      expect(data.recording).toBe(true);

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });

    it('should require path parameter when restarting', async () => {
      await expect(recordToolHandler(browserManager, {
        action: 'restart'
      }))
        .rejects.toThrow('path is required');
    });
  });

  describe('browser_record - error handling', () => {
    it('should require action parameter', async () => {
      await expect(recordToolHandler(browserManager, {}))
        .rejects.toThrow('action is required');
    });

    it('should reject invalid action', async () => {
      await expect(recordToolHandler(browserManager, {
        action: 'invalid'
      }))
        .rejects.toThrow('Invalid action');
    });

    it('should create output directory if it does not exist', async () => {
      const nestedDir = path.join(tempDir, 'nested', 'directory');
      const outputPath = path.join(nestedDir, 'test-nested.webm');

      const result = await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      });

      expect(result.content[0].type).toBe('text');

      const data = JSON.parse(result.content[0].text);
      expect(data.success).toBe(true);

      // Verify directory was created
      expect(fs.existsSync(nestedDir)).toBe(true);

      // Clean up
      await recordToolHandler(browserManager, { action: 'stop' });
    });
  });

  describe('browser_record - complex scenarios', () => {
    it('should handle multiple start-stop cycles', async () => {
      // Ensure we start with no active recording
      if (browserManager.isRecording()) {
        await recordToolHandler(browserManager, { action: 'stop' });
      }

      const paths = [
        path.join(tempDir, 'cycle-1.webm'),
        path.join(tempDir, 'cycle-2.webm'),
        path.join(tempDir, 'cycle-3.webm')
      ];

      // Multiple recording cycles
      for (const recordingPath of paths) {
        await recordToolHandler(browserManager, {
          action: 'start',
          path: recordingPath
        });

        // Generate some content
        await navigateTool(browserManager, { url: 'https://example.com' });
        await new Promise(resolve => setTimeout(resolve, 500));

        await recordToolHandler(browserManager, { action: 'stop' });

        // Verify file was created
        expect(fs.existsSync(recordingPath)).toBe(true);
      }

      // Verify all files exist
      paths.forEach(recordingPath => {
        expect(fs.existsSync(recordingPath)).toBe(true);
        const stats = fs.statSync(recordingPath);
        expect(stats.size).toBeGreaterThan(0);
      });
    });

    it('should preserve video quality across recordings', async () => {
      // Ensure we start with no active recording
      if (browserManager.isRecording()) {
        await recordToolHandler(browserManager, { action: 'stop' });
      }

      const outputPath = path.join(tempDir, 'quality-test.webm');

      await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      });

      // Navigate to a page with content
      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 2000));

      await recordToolHandler(browserManager, { action: 'stop' });

      // Verify file exists and has reasonable size
      expect(fs.existsSync(outputPath)).toBe(true);
      const stats = fs.statSync(outputPath);

      // Video file should be at least a few KB (even for simple content)
      expect(stats.size).toBeGreaterThan(1000);

      // File should not be excessively large (less than 10MB for simple content)
      expect(stats.size).toBeLessThan(10 * 1024 * 1024);
    });
  });

  describe('browser_record - file management', () => {
    it('should produce valid WebM files', async () => {
      // Ensure we start with no active recording
      if (browserManager.isRecording()) {
        await recordToolHandler(browserManager, { action: 'stop' });
      }

      const outputPath = path.join(tempDir, 'valid-webm.webm');

      await recordToolHandler(browserManager, {
        action: 'start',
        path: outputPath
      });

      await navigateTool(browserManager, { url: 'https://example.com' });
      await new Promise(resolve => setTimeout(resolve, 1000));

      await recordToolHandler(browserManager, { action: 'stop' });

      // Verify file exists
      expect(fs.existsSync(outputPath)).toBe(true);

      // Check file has WebM magic bytes (EBML header)
      const buffer = fs.readFileSync(outputPath);
      // WebM files start with EBML header (1A 45 DF A3)
      expect(buffer[0]).toBe(0x1A);
      expect(buffer[1]).toBe(0x45);
      expect(buffer[2]).toBe(0xDF);
      expect(buffer[3]).toBe(0xA3);
    });
  });
});
