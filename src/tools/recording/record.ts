import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Video recording tool for capturing browser interactions
 *
 * Reference agent-browser:
 * - record start ./demo.webm          # Start recording to file
 * - record stop                       # Stop recording
 * - record restart ./take2.webm       # Stop current and start new recording
 */
export const recordTool: Tool = {
  name: 'browser_record',
  description: `
**Record the browser session to a video file.**

Use this tool to start, stop, or restart video recording of the current browser session.

**ACTIONS:**

**action** (required)
  Recording action to perform
  Values: "start", "stop", "restart"

**path** (required for start/restart)
  Output file path for the video recording (must be .webm format)
  Example: "demo.webm", "./recordings/session.webm", "/tmp/video.webm"

**url** (optional, for start/restart)
  URL to navigate to when starting recording
  If not specified, uses the current page URL
  Example: "https://example.com"

**EXAMPLES:**

Start recording current page:
  browser_record with action="start", path="./demo.webm"

Start recording with navigation:
  browser_record with action="start", path="./demo.webm", url="https://example.com"

Stop recording and save:
  browser_record with action="stop"

Restart recording (stop current + start new):
  browser_record with action="restart", path="./take2.webm"

Restart with new URL:
  browser_record with action="restart", path="./take2.webm", url="https://newsite.com"

**OUTPUT:**
- Success status
- Absolute path to saved video file
- Recording state
- File size (when recording stops)
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Recording action to perform',
        enum: ['start', 'stop', 'restart']
      },
      path: {
        type: 'string',
        description: 'Output file path for the video (required for start/restart, must be .webm). Example: "demo.webm", "./recordings/session.webm"'
      },
      url: {
        type: 'string',
        description: 'URL to navigate to when starting recording (optional, uses current page if not specified)'
      }
    },
    required: ['action']
  }
};

export async function recordToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  if (!action) {
    throw new Error('action is required (start, stop, or restart)');
  }

  if (action === 'start') {
    return await handleStart(browserManager, params);
  } else if (action === 'stop') {
    return await handleStop(browserManager);
  } else if (action === 'restart') {
    return await handleRestart(browserManager, params);
  } else {
    throw new Error(`Invalid action: ${action}. Must be start, stop, or restart`);
  }
}

/**
 * Handle start recording action
 */
async function handleStart(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const outputPath = params.path as string;

  if (!outputPath) {
    throw new Error('path is required when starting recording');
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(outputPath);

  // Ensure directory exists
  const directory = path.dirname(absolutePath);
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${directory}. Error: ${error}`);
    }
  }

  // Get optional URL parameter
  const url = params.url as string | undefined;

  try {
    // Start recording
    await browserManager.startRecording(absolutePath, url);

    // Get current page info for response
    const page = browserManager.getPage();
    const currentUrl = page.url();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Recording started successfully`,
          action: 'start',
          outputPath: absolutePath,
          currentUrl: currentUrl,
          recording: true,
          note: 'Video will be saved when recording stops'
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to start recording: ${error}`);
  }
}

/**
 * Handle stop recording action
 */
async function handleStop(
  browserManager: BrowserManager
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  try {
    // Check if recording is active
    if (!browserManager.isRecording()) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: 'No recording in progress',
            action: 'stop',
            recording: false
          }, null, 2)
        }]
      };
    }

    // Stop recording
    const result = await browserManager.stopRecording();

    if (result.error) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            message: `Recording stopped with error: ${result.error}`,
            action: 'stop',
            outputPath: result.path,
            recording: false
          }, null, 2)
        }]
      };
    }

    // Get file stats if file exists
    let fileSize = 0;
    let fileSizeFormatted = 'N/A';
    if (result.path && fs.existsSync(result.path)) {
      const stats = fs.statSync(result.path);
      fileSize = stats.size;
      fileSizeFormatted = formatFileSize(stats.size);
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `Recording stopped and saved successfully`,
          action: 'stop',
          outputPath: result.path,
          size: fileSize,
          sizeFormatted: fileSizeFormatted,
          recording: false
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to stop recording: ${error}`);
  }
}

/**
 * Handle restart recording action
 */
async function handleRestart(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const outputPath = params.path as string;

  if (!outputPath) {
    throw new Error('path is required when restarting recording');
  }

  // Resolve to absolute path
  const absolutePath = path.resolve(outputPath);

  // Ensure directory exists
  const directory = path.dirname(absolutePath);
  if (!fs.existsSync(directory)) {
    try {
      fs.mkdirSync(directory, { recursive: true });
    } catch (error) {
      throw new Error(`Failed to create directory: ${directory}. Error: ${error}`);
    }
  }

  // Get optional URL parameter
  const url = params.url as string | undefined;

  try {
    // Restart recording (stops current if any, starts new)
    const result = await browserManager.restartRecording(absolutePath, url);

    // Get file stats for previous recording if it exists
    let previousFileSize = 0;
    let previousFileSizeFormatted = 'N/A';
    if (result.previousPath && fs.existsSync(result.previousPath)) {
      const stats = fs.statSync(result.previousPath);
      previousFileSize = stats.size;
      previousFileSizeFormatted = formatFileSize(stats.size);
    }

    // Get current page info for response
    const page = browserManager.getPage();
    const currentUrl = page.url();

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: result.stopped
            ? `Recording restarted (previous recording saved)`
            : `Recording started (no previous recording to stop)`,
          action: 'restart',
          outputPath: absolutePath,
          previousPath: result.previousPath || null,
          previousSize: result.stopped ? previousFileSize : null,
          previousSizeFormatted: result.stopped ? previousFileSizeFormatted : null,
          stoppedPrevious: result.stopped,
          currentUrl: currentUrl,
          recording: true,
          note: 'Video will be saved when recording stops'
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to restart recording: ${error}`);
  }
}

/**
 * Format file size in human-readable format
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

export const recordToolDefinition = {
  name: recordTool.name,
  description: recordTool.description,
  inputSchema: recordTool.inputSchema
};
