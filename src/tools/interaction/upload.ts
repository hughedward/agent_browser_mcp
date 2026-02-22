import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';
import { resolveRef } from '../../utils/ref-resolver.js';
import { promises as fs } from 'fs';
import path from 'path';

/**
 * Upload file(s) to a file input element using a ref
 */
export async function uploadTool(
  browserManager: BrowserManager,
  args: { ref: string; paths: string[] }
): Promise<{ content: Array<{ type: string; text: string }> }> {
  const page = browserManager.getPage();
  const refMap = browserManager.getRefMap();

  const locator = resolveRef(page, args.ref, refMap);

  // Validate that files exist
  for (const filePath of args.paths) {
    try {
      await fs.access(filePath);
    } catch (error) {
      throw new Error(`File not found or not accessible: ${filePath}`);
    }
  }

  // Upload the files
  await locator.setInputFiles(args.paths);

  return {
    content: [
      {
        type: 'text',
        text: `Uploaded ${args.paths.length} file(s) to ${args.ref}: ${args.paths.map(p => path.basename(p)).join(', ')}`,
      },
    ],
  };
}

/**
 * Upload tool definition
 */
export const uploadToolDefinition: Tool = {
  name: 'browser_upload',
  description: `
Upload one or more files to a file input element using a ref.

Supports refs from browser_snapshot (e.g., "e1", "@e1").

The paths must be absolute paths to files on the local system.

For single file uploads, provide one path.
For multiple file uploads, provide multiple paths.

Example: Upload a single file
  paths: ["/path/to/file.pdf"]

Example: Upload multiple files
  paths: ["/path/to/file1.jpg", "/path/to/file2.jpg"]

If the ref is invalid (page changed), you'll get an error
listing available refs. Call browser_snapshot to refresh.

If a file doesn't exist or isn't accessible, you'll get an error.
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      ref: {
        type: 'string',
        description: 'Element reference (e.g., "e1", "@e1")',
        pattern: '^@?e\\d+$',
      },
      paths: {
        type: 'array',
        items: {
          type: 'string',
        },
        description: 'Array of absolute file paths to upload. All files must exist and be accessible.',
        minItems: 1,
      },
    },
    required: ['ref', 'paths'],
  },
};
