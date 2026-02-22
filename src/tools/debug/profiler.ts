import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

/**
 * Chrome DevTools Profiler tool
 *
 * Reference agent-browser:
 * - profiler start                    # Start profiling
 * - profiler stop trace.json          # Stop and save profile
 */
export const profilerTool: Tool = {
  name: 'browser_profiler',
  description: `
**Control Chrome DevTools profiler for performance analysis.**

Use this tool to start/stop CPU profiling and capture performance traces for analysis.

**ACTIONS:**

**start** - Start CPU profiling
  action: "start"
  categories: Optional array of trace categories (optional)

  Default categories include:
  - "devtools.timeline"
  - "v8.execute"
  - "disabled-by-default-devtools.timeline"
  - "disabled-by-default-devtools.timeline.frame"
  - "disabled-by-default-v8.cpu_profiler"

**stop** - Stop profiling and save trace
  action: "stop"
  outputPath: Optional file path to save trace (optional, auto-generated if omitted)
  format: Output format - "json" or "cpuprofile" (optional, default: "json")

**status** - Check profiling status
  action: "status"

**EXAMPLES:**

Start profiling with defaults:
  browser_profiler with action="start"

Start with custom categories:
  browser_profiler with action="start", categories=["devtools.timeline", "v8.execute"]

Stop and auto-generate filename:
  browser_profiler with action="stop"

Stop and save to specific path:
  browser_profiler with action="stop", outputPath="/path/to/trace.json"

Check status:
  browser_profiler with action="status"

**OUTPUT:**
- start: Success message with profiling session info
- stop: Success message with trace file path and size
- status: Current profiling state and session details

**NOTES:**
- Profiling uses Chrome DevTools Protocol (CDP) Tracing API
- Trace files can be opened in Chrome DevTools (Performance tab)
- Large traces may take time to collect and save
- Only one profiling session can be active at a time
- Stopping profiling automatically saves the trace
- Traces include CPU usage, memory, network, and rendering data
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
        description: 'Trace categories to record (only for start action)',
        items: {
          type: 'string'
        }
      },
      outputPath: {
        type: 'string',
        description: 'File path to save trace (only for stop action, auto-generated if omitted)'
      },
      format: {
        type: 'string',
        description: 'Output format (only for stop action)',
        enum: ['json', 'cpuprofile'],
        default: 'json'
      }
    },
    required: ['action']
  }
};

// Track profiling state
let isProfiling = false;
let profileSessionId: string | null = null;
let profileDataChunks: Buffer[] = [];

export async function profilerToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const action = params.action as string;

  switch (action) {
    case 'start': {
      if (isProfiling) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'Profiling is already active. Stop current session first.',
              isProfiling: true,
              sessionId: profileSessionId
            }, null, 2)
          }]
        };
      }

      const categories = params.categories as string[] | undefined;
      const defaultCategories = [
        'devtools.timeline',
        'v8.execute',
        'disabled-by-default-devtools.timeline',
        'disabled-by-default-devtools.timeline.frame',
        'disabled-by-default-v8.cpu_profiler',
        'disabled-by-default-devtools.timeline.stack'
      ];

      const traceCategories = categories && categories.length > 0
        ? categories.join(',')
        : defaultCategories.join(',');

      try {
        // Get CDP session
        const cdp = await browserManager.getCDPSession();

        // Clear previous data
        profileDataChunks = [];

        // Set up data collection handler
        const dataHandler = (data: any) => {
          // Collect trace data chunks
          if (data.value) {
            const chunk = Buffer.from(data.value, 'base64');
            profileDataChunks.push(chunk);
          }
        };

        // Set up completion handler
        const completeHandler = async () => {
          // Profiling complete - will be handled in stop action
        };

        // Register handlers
        cdp.on('Tracing.dataCollected', dataHandler);
        cdp.on('Tracing.tracingComplete', completeHandler);

        // Store handlers for cleanup
        (cdp as any).__profileDataHandler = dataHandler;
        (cdp as any).__profileCompleteHandler = completeHandler;

        // Start tracing
        await cdp.send('Tracing.start', {
          transferMode: 'ReportEvents',
          traceConfig: {
            recordMode: 'recordAsMuchAsPossible',
            enableSampling: true,
            enableSystrace: false,
            includedCategories: categories && categories.length > 0 ? categories : defaultCategories
          }
        });

        // Generate session ID
        profileSessionId = `prof_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        isProfiling = true;

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'CPU profiling started',
              sessionId: profileSessionId,
              categories: categories && categories.length > 0 ? categories : defaultCategories,
              timestamp: new Date().toISOString()
            }, null, 2)
          }]
        };
      } catch (error) {
        isProfiling = false;
        profileSessionId = null;
        profileDataChunks = [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Failed to start profiling: ${error instanceof Error ? error.message : String(error)}`,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }]
        };
      }
    }

    case 'stop': {
      if (!isProfiling) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: 'No active profiling session. Start profiling first.',
              isProfiling: false
            }, null, 2)
          }]
        };
      }

      const outputPath = params.outputPath as string | undefined;
      const format = params.format as string || 'json';

      try {
        // Get CDP session
        const cdp = await browserManager.getCDPSession();

        // Stop tracing - this will trigger data collection
        await cdp.send('Tracing.end');

        // Wait a bit for all data to be collected
        await new Promise(resolve => setTimeout(resolve, 500));

        // Remove handlers
        if ((cdp as any).__profileDataHandler) {
          cdp.off('Tracing.dataCollected', (cdp as any).__profileDataHandler);
          delete (cdp as any).__profileDataHandler;
        }
        if ((cdp as any).__profileCompleteHandler) {
          cdp.off('Tracing.tracingComplete', (cdp as any).__profileCompleteHandler);
          delete (cdp as any).__profileCompleteHandler;
        }

        // Combine collected data chunks
        const traceData = Buffer.concat(profileDataChunks);

        // Generate output path if not provided
        const finalPath = outputPath || join(tmpdir(), `chrome-trace-${profileSessionId}.json`);

        // Write trace file
        await writeFile(finalPath, traceData);

        const stats = {
          size: traceData.length,
          sizeFormatted: `${(traceData.length / 1024).toFixed(2)} KB`,
          path: finalPath
        };

        // Reset state
        isProfiling = false;
        const sessionId = profileSessionId;
        profileSessionId = null;
        profileDataChunks = [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: 'Profiling stopped and trace saved',
              sessionId: sessionId,
              format: format,
              outputPath: finalPath,
              fileSize: stats.sizeFormatted,
              bytes: stats.size,
              timestamp: new Date().toISOString(),
              note: 'Open the trace file in Chrome DevTools (Performance tab) or chrome://tracing'
            }, null, 2)
          }]
        };
      } catch (error) {
        // Reset state even on error
        isProfiling = false;
        profileSessionId = null;
        profileDataChunks = [];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: false,
              message: `Failed to stop profiling: ${error instanceof Error ? error.message : String(error)}`,
              error: error instanceof Error ? error.message : String(error)
            }, null, 2)
          }]
        };
      }
    }

    case 'status': {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: true,
            isProfiling: isProfiling,
            sessionId: profileSessionId,
            chunksCollected: profileDataChunks.length,
            timestamp: new Date().toISOString()
          }, null, 2)
        }]
      };
    }

    default:
      throw new Error(`Unknown action: ${action}`);
  }
}

export const profilerToolDefinition = {
  name: profilerTool.name,
  description: profilerTool.description,
  inputSchema: profilerTool.inputSchema
};
