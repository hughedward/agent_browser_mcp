import { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { BrowserManager } from '../../browser/manager.js';
import * as fs from 'fs';
import * as path from 'path';

/**
 * PDF export tool for saving the current page as a PDF document
 *
 * Reference agent-browser:
 * - pdf output.pdf                  # Save as PDF
 * - pdf --format A4                 # Specify paper format
 * - pdf --landscape                 # Landscape orientation
 * - pdf --header                    # Display header
 * - pdf --footer "Page % of %"      # Custom footer
 * - pdf --background                # Print background graphics
 */
export const pdfTool: Tool = {
  name: 'browser_pdf',
  description: `
**Save the current page as a PDF document.**

Use this tool to export the current page to PDF format with various customization options.

**OPTIONS:**

**path** (required)
  Output file path for the PDF
  Example: "output.pdf", "./reports/page.pdf", "/tmp/export.pdf"

**format** (optional)
  Paper format for the PDF
  Values: "Letter", "Legal", "Tabloid", "Ledger", "A0", "A1", "A2", "A3", "A4", "A5", "A6"
  Default: "Letter"

**landscape** (optional)
  Orientation of the PDF
  Values: true for landscape, false for portrait
  Default: false (portrait)

**displayHeader** (optional)
  Display header in the PDF
  Values: true or false
  Default: false

**footer** (optional)
  Footer template for the PDF
  Supports placeholders:
  - %: Current page number
  - %*: Total number of pages
  Example: "Page % of %*" produces "Page 1 of 5"
  Default: No footer

**printBackground** (optional)
  Include background graphics when printing
  Values: true or false
  Default: false

**EXAMPLES:**

Save as PDF with default settings:
  browser_pdf with path="output.pdf"

Save as A4 landscape:
  browser_pdf with path="report.pdf", format="A4", landscape=true

Save with page numbers in footer:
  browser_pdf with path="document.pdf", footer="Page % of %*"

Save with background graphics:
  browser_pdf with path="styled.pdf", printBackground=true

Save with header and custom format:
  browser_pdf with path="full.pdf", format="Legal", displayHeader=true, footer="Page % of %*"

Save with all options:
  browser_pdf with path="complete.pdf", format="A4", landscape=true, displayHeader=true, footer="Page % of %*", printBackground=true

**OUTPUT:**
- Success message with absolute file path
- File size in bytes
- Number of pages (if available)
  `.trim(),

  inputSchema: {
    type: 'object',
    properties: {
      path: {
        type: 'string',
        description: 'Output file path for the PDF (required). Example: "output.pdf", "./reports/page.pdf"'
      },
      format: {
        type: 'string',
        description: 'Paper format for the PDF',
        enum: ['Letter', 'Legal', 'Tabloid', 'Ledger', 'A0', 'A1', 'A2', 'A3', 'A4', 'A5', 'A6'],
        default: 'Letter'
      },
      landscape: {
        type: 'boolean',
        description: 'Landscape orientation (true) or portrait orientation (false)',
        default: false
      },
      displayHeader: {
        type: 'boolean',
        description: 'Display header in the PDF',
        default: false
      },
      footer: {
        type: 'string',
        description: 'Footer template. Supports: % for current page, %* for total pages. Example: "Page % of %*"'
      },
      printBackground: {
        type: 'boolean',
        description: 'Include background graphics when printing',
        default: false
      }
    },
    required: ['path']
  }
};

export async function pdfToolHandler(
  browserManager: BrowserManager,
  params: any
): Promise<{
  content: Array<{ type: string; text: string }>;
}> {
  const page = browserManager.getPage();
  const outputPath = params.path as string;

  if (!outputPath) {
    throw new Error('path is required for PDF export');
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

  // Build PDF options
  const pdfOptions: any = {
    path: absolutePath,
    format: (params.format as string) || 'Letter',
    landscape: (params.landscape as boolean) || false,
    displayHeaderFooter: (params.displayHeader as boolean) || false,
    printBackground: (params.printBackground as boolean) || false
  };

  // Add footer template if provided
  if (params.footer) {
    pdfOptions.displayHeaderFooter = true;
    pdfOptions.footerTemplate = params.footer;
  }

  // Header template (default if displayHeader is true)
  if (params.displayHeader && !params.footer) {
    pdfOptions.headerTemplate = '<div style="font-size:10px; text-align:center; width:100%;"> </div>';
  }

  try {
    // Generate PDF
    const pdfBuffer = await page.pdf(pdfOptions);

    // Get file stats
    const stats = fs.statSync(absolutePath);

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          success: true,
          message: `PDF saved successfully`,
          path: absolutePath,
          size: stats.size,
          sizeFormatted: formatFileSize(stats.size),
          format: pdfOptions.format,
          landscape: pdfOptions.landscape,
          printBackground: pdfOptions.printBackground,
          pages: pdfBuffer.length / 1000 // Approximate page count (not exact)
        }, null, 2)
      }]
    };
  } catch (error) {
    throw new Error(`Failed to generate PDF: ${error}`);
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

export const pdfToolDefinition = {
  name: pdfTool.name,
  description: pdfTool.description,
  inputSchema: pdfTool.inputSchema
};
