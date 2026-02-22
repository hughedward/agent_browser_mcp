import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { readFileSync } from 'node:fs';
import crypto from 'node:crypto';

/**
 * Compute a simple hash for string comparison
 */
function computeHash(text: string): string {
  return crypto.createHash('md5').update(text).digest('hex');
}

/**
 * Compute image similarity metric using basic comparison
 */
async function computeImageSimilarity(
  image1: Buffer,
  image2: Buffer
): Promise<{ identical: boolean; sizeDifferent: boolean; ratio: number }> {
  // Check if files are identical
  const hash1 = crypto.createHash('md5').update(image1).digest('hex');
  const hash2 = crypto.createHash('md5').update(image2).digest('hex');

  return {
    identical: hash1 === hash2,
    sizeDifferent: image1.length !== image2.length,
    ratio: image2.length / image1.length,
  };
}

/**
 * Compare snapshots (text-based tree diff)
 */
async function diffSnapshots(baseline: string, current: string): Promise<string> {
  const baselineLines = baseline.split('\n');
  const currentLines = current.split('\n');

  const result: string[] = [];
  let additions = 0;
  let deletions = 0;

  // Simple line-by-line comparison
  const maxLines = Math.max(baselineLines.length, currentLines.length);

  for (let i = 0; i < maxLines; i++) {
    const baselineLine = baselineLines[i]?.trim();
    const currentLine = currentLines[i]?.trim();

    if (baselineLine === currentLine) {
      // Lines are the same
      if (baselineLine !== undefined) {
        result.push(`  ${baselineLine}`);
      }
    } else {
      if (baselineLine !== undefined && currentLines[i] !== undefined) {
        // Both exist but different - modification
        result.push(`- ${baselineLine}`);
        result.push(`+ ${currentLine}`);
        deletions++;
        additions++;
      } else if (baselineLine !== undefined) {
        // Only in baseline
        result.push(`- ${baselineLine}`);
        deletions++;
      } else if (currentLine !== undefined) {
        // Only in current
        result.push(`+ ${currentLine}`);
        additions++;
      }
    }
  }

  let output = `=== Snapshot Diff ===\n`;
  output += `Additions: ${additions}\n`;
  output += `Deletions: ${deletions}\n`;
  output += `Net change: ${additions - deletions} lines\n\n`;

  // Limit output to avoid excessive length
  const maxChanges = 100;
  const changesToShow = result.slice(0, maxChanges);

  if (changesToShow.length > 0) {
    output += `Changes (showing first ${changesToShow.length}):\n${changesToShow.join('\n')}`;
    if (result.length > maxChanges) {
      output += `\n... (${result.length - maxChanges} more changes hidden)`;
    }
  } else {
    output += `(No changes detected)`;
  }

  return output;
}

/**
 * Diff tool handler
 */
export async function diffTool(
  browserManager: BrowserManager,
  args: {
    type: 'snapshot' | 'screenshot' | 'url';
    baseline?: string;
    current?: string;
    url1?: string;
    url2?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string; data?: string; mimeType?: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();

    if (args.type === 'snapshot') {
      // Compare snapshots
      let baselineSnapshot: string;
      let currentSnapshot: string;

      if (args.baseline) {
        // Load baseline from file
        try {
          baselineSnapshot = readFileSync(args.baseline, 'utf-8');
        } catch (error) {
          throw new Error(`Failed to read baseline file: ${args.baseline}`);
        }
      } else {
        // Use stored baseline from browser manager
        baselineSnapshot = browserManager.getLastSnapshot();
        if (!baselineSnapshot) {
          throw new Error(
            'No baseline snapshot available. Either provide a baseline file or take a snapshot first.'
          );
        }
      }

      // Get current snapshot
      const snapshot = await browserManager.getSnapshot();
      currentSnapshot = snapshot.tree;

      // Compare and optionally update baseline
      const diff = await diffSnapshots(baselineSnapshot, currentSnapshot);

      return {
        content: [
          {
            type: 'text',
            text: diff,
          },
        ],
      };
    } else if (args.type === 'screenshot') {
      // Compare screenshots
      if (!args.baseline) {
        throw new Error('baseline file path is required for screenshot diff');
      }

      // Read baseline screenshot
      let baselineScreenshot: Buffer;
      try {
        baselineScreenshot = readFileSync(args.baseline);
      } catch (error) {
        throw new Error(`Failed to read baseline screenshot: ${args.baseline}`);
      }

      // Take current screenshot
      const currentScreenshot = await page.screenshot();

      // Compare images
      const comparison = await computeImageSimilarity(baselineScreenshot, currentScreenshot);

      let result = `=== Screenshot Diff ===\n`;
      result += `Baseline: ${args.baseline}\n`;
      result += `Identical: ${comparison.identical}\n`;
      result += `Size different: ${comparison.sizeDifferent}\n`;

      if (!comparison.identical) {
        result += `Size ratio (current/baseline): ${comparison.ratio.toFixed(2)}\n`;
        result += `Baseline size: ${baselineScreenshot.length} bytes\n`;
        result += `Current size: ${currentScreenshot.length} bytes\n`;

        // Include current screenshot for visual comparison
        const base64 = currentScreenshot.toString('base64');
        return {
          content: [
            {
              type: 'text',
              text: result,
            },
            {
              type: 'image',
              data: base64,
              mimeType: 'image/png',
              text: 'Current screenshot',
            } as any,
          ],
        };
      }

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } else if (args.type === 'url') {
      // Compare two URLs
      if (!args.url1 || !args.url2) {
        throw new Error('url1 and url2 are required for URL diff');
      }

      // Take snapshot of first URL
      await page.goto(args.url1, { waitUntil: 'load' });
      const snapshot1 = await browserManager.getSnapshot();

      // Take snapshot of second URL
      await page.goto(args.url2, { waitUntil: 'load' });
      const snapshot2 = await browserManager.getSnapshot();

      // Compare snapshots
      const diff = await diffSnapshots(snapshot1.tree, snapshot2.tree);

      let result = `=== URL Diff ===\n`;
      result += `URL 1: ${args.url1}\n`;
      result += `URL 2: ${args.url2}\n\n`;
      result += diff;

      return {
        content: [
          {
            type: 'text',
            text: result,
          },
        ],
      };
    } else {
      throw new Error(`Invalid diff type: ${args.type}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Failed to perform diff: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
}

/**
 * Diff tool definition
 */
export const diffToolDefinition: Tool = {
  name: 'browser_diff',
  description: `
Compare snapshots, screenshots, or URLs to detect changes.

TYPES:
1. snapshot: Compare page structure (text-based tree diff)
   - Baseline from file or last snapshot
   - Shows additions, deletions, modifications

2. screenshot: Compare visual screenshots
   - Requires baseline file path
   - Detects identical, size differences
   - Returns current screenshot for visual comparison

3. url: Compare two different URLs
   - Navigates to both URLs
   - Compares their snapshots

SNAPSHOT USAGE:
1. Compare with file:
   { type: "snapshot", baseline: "/path/to/baseline.txt" }

2. Compare with last snapshot (in-memory):
   { type: "snapshot" }

SCREENSHOT USAGE:
{ type: "screenshot", baseline: "/path/to/baseline.png" }

URL USAGE:
{ type: "url", url1: "https://v1.example.com", url2: "https://v2.example.com" }

OUTPUT:
- snapshot: Line-by-line diff with statistics
- screenshot: Comparison metrics + current screenshot
- url: Diff between two URLs

TIP: Use snapshot to capture baseline first, then diff to compare.
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      type: {
        type: 'string',
        enum: ['snapshot', 'screenshot', 'url'],
        description: 'Type of comparison to perform',
      },
      baseline: {
        type: 'string',
        description: 'Path to baseline file (snapshot text or screenshot image). Required for screenshot type.',
      },
      current: {
        type: 'string',
        description: 'Path to current file (optional, defaults to live page state).',
      },
      url1: {
        type: 'string',
        description: 'First URL to compare (for url type)',
      },
      url2: {
        type: 'string',
        description: 'Second URL to compare (for url type)',
      },
    },
    required: ['type'],
  },
};
