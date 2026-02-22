import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import { Download } from 'playwright-core';

/**
 * Download management tool
 *
 * Reference agent-browser:
 * - download handle                 # Handle downloads
 * - download wait                   # Wait for download to complete
 */
export const downloadTool: Tool = {
  name: 'browser_download',
  description: `
**Manage file downloads from the browser.**

Use this tool to wait for downloads, get download paths, and handle file downloads initiated by page actions.

**ACTIONS:**

**wait** - Wait for a download to complete
  action: "wait"
  timeout: Maximum wait time in milliseconds (optional, default: 30000)

**list** - List all downloads in current session
  action: "list"

**get** - Get information about a specific download
  action: "get"
  id: Download ID (from list action or wait action)

**delete** - Delete a downloaded file
  action: "delete"
  id: Download ID to delete

**path** - Get the file path of the most recent download
  action: "path"

**EXAMPLES:**

Wait for download after clicking a download button:
  1. Click download button using browser_click
  2. browser_download with action="wait"

Wait with custom timeout:
  browser_download with action="wait", timeout=60000

List all downloads:
  browser_download with action="list"

Get specific download info:
  browser_download with action="get", id="0"

Get most recent download path:
  browser_download with action="path"

Delete downloaded file:
  browser_download with action="delete", id="0"

**OUTPUT:**
- wait: Download information including path, filename, and size
- list: Array of all downloads with IDs and metadata
- get: Detailed information about specific download
- delete: Success message with deleted file info
- path: File path of most recent download

**NOTES:**
- Downloads must be initiated by page actions (clicks, form submissions, etc.)
- Only wait for downloads that will actually occur (not for navigation or API calls)
- Download paths are in the browser's download directory
- Files are automatically cleaned up when browser closes unless explicitly saved
- Large files may take longer to download; adjust timeout accordingly
- Download IDs are 0-indexed (0 = first download, 1 = second, etc.)
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      action: {
        type: 'string',
        description: 'Action to perform (wait, list, get, delete, path)',
        enum: ['wait', 'list', 'get', 'delete', 'path']
      },
      timeout: {
        type: 'number',
        description: 'Maximum wait time in milliseconds (only for wait action, default: 30000)'
      },
      id: {
        type: 'string',
        description: 'Download ID (for get/delete actions)'
      }
    },
    required: ['action']
  }
};

export async function downloadToolHandler(
  browserManager: BrowserManager,
  args: {
    action: 'wait' | 'list' | 'get' | 'delete' | 'path';
    timeout?: number;
    id?: string;
  }
): Promise<{
  content: Array<{ type: string; text: string }>;
  isError?: boolean;
}> {
  try {
    const page = browserManager.getPage();
    if (!page) {
      throw new Error('No active page. Please navigate first.');
    }

    switch (args.action) {
      case 'wait': {
        const timeout = args.timeout || 30000;

        // Set up download handler
        const downloadPromise = page.waitForEvent('download', { timeout });

        try {
          const download = await downloadPromise;

          // Wait for download to complete
          const path = await download.path();

          // Get download metadata
          const url = download.url();
          const suggestedFilename = download.suggestedFilename();
          const contentType = await page.evaluate(async () => {
            // Try to get content type from last download
            return 'unknown';
          }).catch(() => 'unknown');

          // Get file size
          const fs = await import('node:fs/promises');
          const stats = await fs.stat(path).catch(() => null);
          const fileSize = stats?.size || 0;
          const fileSizeFormatted = fileSize > 0
            ? `${(fileSize / 1024).toFixed(2)} KB`
            : 'unknown';

          // Store download in browser manager's download list
          const downloads = (browserManager as any).downloads || [];
          const downloadId = downloads.length.toString();
          downloads.push({
            id: downloadId,
            path: path,
            url: url,
            suggestedFilename: suggestedFilename,
            contentType: contentType,
            fileSize: fileSize,
            timestamp: Date.now()
          });
          (browserManager as any).downloads = downloads;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'Download completed',
                downloadId: downloadId,
                path: path,
                filename: suggestedFilename,
                url: url,
                contentType: contentType,
                fileSize: fileSizeFormatted,
                bytes: fileSize,
                timestamp: new Date().toISOString()
              }, null, 2)
            }]
          };
        } catch (error) {
          // Check if it's a timeout
          if (error instanceof Error && error.message.includes('Timeout')) {
            return {
              content: [{
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: 'Download timeout - no download started within the specified time',
                  timeout: timeout,
                  hint: 'Make sure a download action (click, form submit) is performed before waiting'
                }, null, 2)
              }],
              isError: true
            };
          }
          throw error;
        }
      }

      case 'list': {
        const downloads = (browserManager as any).downloads || [];

        if (downloads.length === 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: 'No downloads in current session',
                count: 0,
                downloads: []
              }, null, 2)
            }]
          };
        }

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              message: `Found ${downloads.length} download${downloads.length === 1 ? '' : 's'}`,
              count: downloads.length,
              downloads: downloads.map((d: any) => ({
                id: d.id,
                filename: d.suggestedFilename,
                path: d.path,
                url: d.url,
                fileSize: d.fileSize > 0 ? `${(d.fileSize / 1024).toFixed(2)} KB` : 'unknown',
                timestamp: new Date(d.timestamp).toISOString()
              }))
            }, null, 2)
          }]
        };
      }

      case 'get': {
        const downloadId = args.id;

        if (!downloadId) {
          throw new Error('Download ID is required for get action');
        }

        const downloads = (browserManager as any).downloads || [];
        const download = downloads[parseInt(downloadId)];

        if (!download) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Download with ID ${downloadId} not found`,
                availableIds: downloads.map((d: any, i: number) => i.toString())
              }, null, 2)
            }],
            isError: true
          };
        }

        // Check if file still exists
        const fs = await import('node:fs/promises');
        const exists = await fs.access(download.path).then(() => true).catch(() => false);

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              download: {
                id: download.id,
                filename: download.suggestedFilename,
                path: download.path,
                url: download.url,
                contentType: download.contentType,
                fileSize: download.fileSize > 0 ? `${(download.fileSize / 1024).toFixed(2)} KB` : 'unknown',
                bytes: download.fileSize,
                exists: exists,
                timestamp: new Date(download.timestamp).toISOString()
              }
            }, null, 2)
          }]
        };
      }

      case 'delete': {
        const downloadId = args.id;

        if (!downloadId) {
          throw new Error('Download ID is required for delete action');
        }

        const downloads = (browserManager as any).downloads || [];
        const download = downloads[parseInt(downloadId)];

        if (!download) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Download with ID ${downloadId} not found`,
                availableIds: downloads.map((d: any, i: number) => i.toString())
              }, null, 2)
            }],
            isError: true
          };
        }

        // Delete the file
        const fs = await import('node:fs/promises');
        try {
          await fs.unlink(download.path);

          // Remove from downloads list
          downloads.splice(parseInt(downloadId), 1);
          (browserManager as any).downloads = downloads;

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Deleted file: ${download.suggestedFilename}`,
                deletedFile: {
                  filename: download.suggestedFilename,
                  path: download.path
                }
              }, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Failed to delete file: ${error instanceof Error ? error.message : String(error)}`,
                path: download.path
              }, null, 2)
            }],
            isError: true
          };
        }
      }

      case 'path': {
        const downloads = (browserManager as any).downloads || [];

        if (downloads.length === 0) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: 'No downloads in current session',
                hint: 'Initiate a download and use action="wait" first'
              }, null, 2)
            }],
            isError: true
          };
        }

        // Get most recent download
        const lastDownload = downloads[downloads.length - 1];

        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              success: true,
              path: lastDownload.path,
              filename: lastDownload.suggestedFilename,
              downloadId: lastDownload.id,
              timestamp: new Date(lastDownload.timestamp).toISOString()
            }, null, 2)
          }]
        };
      }

      default:
        throw new Error(`Invalid download action: ${args.action}`);
    }
  } catch (error) {
    return {
      content: [{
        type: 'text',
        text: `Download action failed: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true
    };
  }
}

export const downloadToolDefinition: Tool = {
  name: downloadTool.name,
  description: downloadTool.description,
  inputSchema: downloadTool.inputSchema
};
