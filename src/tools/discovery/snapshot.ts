/**
 * browser_snapshot tool - THE CORE TOOL FOR TOKEN OPTIMIZATION
 *
 * This tool captures the current page state as an accessibility tree with
 * embedded element refs (@e1, @e2, etc.) that can be used for precise,
 * deterministic interaction.
 *
 * KEY FEATURES:
 * - Updates ref cache in BrowserManager for subsequent @ref lookups
 * - Supports multiple filtering modes (interactive, compact, cursor)
 * - Returns ref map for efficient element targeting
 * - Enables token-efficient workflows (snapshot once, interact many times)
 *
 * USAGE EXAMPLES:
 * 1. Full page snapshot:
 *    browser_snapshot{}
 *    → Returns complete tree with all refs
 *
 * 2. Interactive elements only:
 *    browser_snapshot{interactive: true}
 *    → Returns only buttons, links, inputs, etc.
 *
 * 3. Compact mode (removes structural noise):
 *    browser_snapshot{compact: true}
 *    → Removes generic containers, focuses on content
 *
 * 4. With cursor-interactive detection:
 *    browser_snapshot{cursor: true}
 *    → Finds elements with onclick/cursor:pointer/tabindex
 *
 * 5. Scoped to specific element:
 *    browser_snapshot{selector: "#main-content"}
 *    → Returns snapshot of just that subtree
 *
 * REF SYSTEM:
 * - Each interactive element gets a unique ref (e1, e2, e3, ...)
 * - Refs are stored in BrowserManager's ref cache
 * - Subsequent tools can use @e1, @e2, etc. to target elements
 * - Refs survive page mutations (detected via CSS selector or ARIA role)
 */

import { Tool } from '@modelcontextprotocol/sdk/types.js';
import { BrowserManager } from '../../browser/manager.js';

export const snapshotTool: Tool = {
  name: 'browser_snapshot',
  description: `
**THE CORE TOOL FOR TOKEN OPTIMIZATION**

Capture the current page state as an accessibility tree with embedded element refs.
This is the PRIMARY tool for understanding page structure and enabling efficient interaction.

**WHEN TO USE:**
- First step after navigating to a new page
- When you need to understand page structure
- Before interacting with elements (to get refs)
- After dynamic content updates (to refresh refs)
- To verify page state changes

**FEATURES:**
- Returns accessibility tree with interactive elements
- Embeds refs (@e1, @e2, etc.) for each interactive element
- Updates ref cache in BrowserManager for subsequent @ref lookups
- Supports filtering modes (interactive, compact, cursor, maxDepth, selector)

**REF SYSTEM:**
- Each interactive element gets a unique ref (e1, e2, e3, ...)
- Refs are stored in BrowserManager's ref cache
- Subsequent tools can use @e1, @e2, etc. to target elements
- Refs survive page mutations (detected via CSS selector or ARIA role)

**OUTPUT FORMAT:**
{
  tree: string,        // Accessibility tree with embedded refs
  refs: {...},         // Map of ref IDs to element metadata
  url: string,         // Current page URL
  title: string,       // Page title
  refCount: number     // Total number of refs in cache
}

**EXAMPLE OUTPUT:**
tree: |
  - heading "Welcome" [ref=e1] [level=1]
  - link "Login" [ref=e2]
  - textbox "Email" [ref=e3]
  - button "Submit" [ref=e4]

refs: {
  "e1": { selector: "getByRole('heading', { name: 'Welcome', exact: true })", role: "heading", name: "Welcome" },
  "e2": { selector: "getByRole('link', { name: 'Login', exact: true })", role: "link", name: "Login" },
  ...
}
  `.trim(),
  inputSchema: {
    type: 'object',
    properties: {
      interactive: {
        type: 'boolean',
        description: 'Only include interactive elements (buttons, links, inputs, etc.). Filters out static content like headings, paragraphs, etc.'
      },
      compact: {
        type: 'boolean',
        description: 'Remove structural elements without meaningful content (generic containers, groups, etc.). Focuses on actual content.'
      },
      cursor: {
        type: 'boolean',
        description: 'Include cursor-interactive elements (elements with cursor:pointer, onclick handlers, or tabindex). Useful for finding clickable divs/spans.'
      },
      maxDepth: {
        type: 'number',
        description: 'Maximum depth of tree to include (0 = root only). Useful for limiting snapshot size on complex pages.'
      },
      selector: {
        type: 'string',
        description: 'CSS selector to scope the snapshot to a specific subtree. Useful for focusing on a specific region of the page.'
      }
    }
  }
};

export async function handleSnapshot(
  browserManager: BrowserManager,
  args: Record<string, unknown>
): Promise<{
  tree: string;
  refs: Record<string, unknown>;
  url: string;
  title: string;
  refCount: number;
}> {
  const options = {
    interactive: args.interactive as boolean | undefined,
    compact: args.compact as boolean | undefined,
    cursor: args.cursor as boolean | undefined,
    maxDepth: args.maxDepth as number | undefined,
    selector: args.selector as string | undefined,
  };

  // Get enhanced snapshot (this updates the ref cache in BrowserManager)
  const snapshot = await browserManager.getSnapshot(options);

  // Get page info
  const page = browserManager.getPage();
  const url = page.url();
  const title = await page.title().catch(() => '');

  // Get ref count
  const refMap = browserManager.getRefMap();
  const refCount = Object.keys(refMap).length;

  return {
    tree: snapshot.tree,
    refs: snapshot.refs,
    url,
    title,
    refCount,
  };
}
