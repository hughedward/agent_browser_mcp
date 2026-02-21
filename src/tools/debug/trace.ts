import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import path from 'node:path';
import os from 'node:os';
import { existsSync, renameSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * Chrome DevTools tracing tool
 *
 * Reference agent-browser:
 * - trace start               # Start tracing
 * - trace stop trace.zip      # Stop tracing and save to zip
 */
export const traceTool: Tool = {
  name: 'browser_trace',
  description: `
**Start and stop Chrome DevTools Protocol (CDP) tracing for performance profiling.**

Use this tool to capture detailed performance traces of browser activity, including JavaScript execution, rendering, and network events. Traces can be opened in Chrome DevTools (chrome://tracing) or Chrome Performance panel.

**ACTIONS:**

**start** - Start tracing
  action: "start"
  categories: Optional array of CDP trace categories (optional, default: comprehensive set)
    Default categories include:
    - devtools.timeline: DevTools timeline events
    - disabled-by-default-devtools.timeline: Detailed timeline data
    - disabled-by-default-devtools.timeline.frame: Frame-level timeline
    - disabled-by-default-devtools.timeline.stack: Call stack information
    - v8.execute: JavaScript execution
    - disabled-by-default-v8.cpu_profiler: V8 CPU profiling
    - blink: Rendering engine events
    - blink.user_timing: User Timing API
    - latencyInfo: Input latency tracking
    - renderer.scheduler: Renderer scheduling
    - toplevel: Top-level task execution

**stop** - Stop tracing and save to file
  action: "stop"
  path: Output file path (required, must end with .zip)
    The trace file will be zipped and can be opened in chrome://tracing

  Note: Uses system zip command. On macOS/Linux, ensure 'zip' is available.
        If zip command fails, falls back to saving as .json with renamed .zip extension.

**status** - Check if tracing is active
  action: "status"

**EXAMPLES:**

Start tracing with default categories:
  browser_trace with action="start"

Start tracing with specific categories:
  browser_trace with action="start", categories=["devtools.timeline", "v8.execute"]

Stop and save trace to zip file:
  browser_trace with action="stop", path="performance-trace.zip"

Stop and save with absolute path:
  browser_trace with action="stop", path="/tmp/my-trace.zip"

Check tracing status:
  browser_trace with action="status"

**OUTPUT:**
- start: Success message with categories being traced
- stop: Success message with file path, size, and event count
- status: Current tracing state and categories (if active)

**NOTES:**
- Only works with Chromium-based browsers (requires CDP support)
- Trace files are saved in JSON format and automatically zipped
- The zip file can be opened in Chrome DevTools (chrome://tracing) or the Performance panel
- Tracing captures detailed performance data and can generate large files
- Maximum of 5,000,000 trace events will be captured (higher count events are dropped)
- Tracing should be stopped before closing the browser
- Both start and stop actions must use the same browser session
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (start, stop, status)',
        enum: ['start', 'stop', 'status']
      },
      categories: {
        type: 'array',
        description: 'CDP trace categories to capture (only for start action)',
        items: {
          type: 'string'
        }
      },
      path: {
        type: 'string',
        description: 'Output zip file path (required for stop action, must end with .zip)'
      }
    },
    required: ['action']
  }
};

export async function traceToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'start': {
      // Check if already profiling
      if (browserManager.isProfilingActive()) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'Profiling is already active. Stop current profiling session first.',
              active: true
            }, null, 2)
          }]
        };
      }

      const categories = params.categories as string[] | undefined;

      // Start profiling using BrowserManager's existing method
      await browserManager.startProfiling({ categories });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: 'Started Chrome DevTools Protocol tracing',
            active: true,
            categories: categories || 'default comprehensive set'
          }, null, 2)
        }]
      };
    }

    case 'stop': {
      const outputPath = params.path as string;

      if (!outputPath) {
        throw new Error('path is required for stop action');
      }

      // Validate output path is .zip
      if (!outputPath.endsWith('.zip')) {
        throw new Error('Output path must end with .zip extension');
      }

      // Check if already not profiling
      if (!browserManager.isProfilingActive()) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No profiling session active. Start profiling first.',
              active: false
            }, null, 2)
          }]
        };
      }

      // Check if output file already exists
      if (existsSync(outputPath)) {
        throw new Error(`Output file already exists: ${outputPath}`);
      }

      // Generate temp path for the JSON trace
      const tempDir = path.join(os.tmpdir(), `agent-browser-trace-${Date.now()}`);
      const tempTracePath = path.join(tempDir, 'trace.json');

      // Stop profiling and get the trace data
      const result = await browserManager.stopProfiling(tempTracePath);

      // Create zip file using system zip command
      let zipSuccess = false;
      let fileSize = 0;

      try {
        // Try to use system zip command
        execSync(`zip -j "${outputPath}" "${tempTracePath}"`, { stdio: 'ignore' });
        zipSuccess = true;

        // Get file size
        const fs = await import('node:fs');
        const stats = fs.statSync(outputPath);
        fileSize = stats.size;
      } catch (zipError) {
        // If zip fails, rename the JSON file to .zip (it's still usable)
        // Chrome can open the JSON file even with .zip extension
        try {
          renameSync(tempTracePath, outputPath);
          const fs = await import('node:fs');
          const stats = fs.statSync(outputPath);
          fileSize = stats.size;
        } catch (renameError) {
          throw new Error(`Failed to create zip file: ${zipError}`);
        }
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            message: zipSuccess
              ? 'Stopped profiling and saved trace to zip file'
              : 'Stopped profiling and saved trace (zip command unavailable, saved as JSON with .zip extension)',
            path: outputPath,
            eventCount: result.eventCount,
            sizeBytes: fileSize,
            sizeMB: (fileSize / 1024 / 1024).toFixed(2),
            note: 'Open this file in Chrome DevTools (chrome://tracing) or Performance panel'
          }, null, 2)
        }]
      };
    }

    case 'status': {
      const isActive = browserManager.isProfilingActive();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            active: isActive,
            message: isActive
              ? 'Profiling session is active. Use action="stop" to save the trace.'
              : 'No profiling session active. Use action="start" to begin tracing.'
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const traceToolDefinition = {
  name: traceTool.name,
  description: traceTool.description,
  inputSchema: traceTool.inputSchema
};
