import type { Page, Locator } from 'playwright-core';
import type { RefData } from './ref-cache.js';
import type { RefMap } from '../browser/snapshot.js';

/**
 * Parse ref string (supports "e1" and "@e1" formats)
 */
export function parseRef(ref: string): string | null {
  const match = ref.match(/^@?(e\d+)$/);
  return match ? match[1] : null;
}

/**
 * Build locator from ref data
 */
export function locatorFromRef(
  page: Page,
  refData: RefData
): Locator {
  // Check if this is a cursor-interactive element (uses CSS selector)
  if (refData.role === 'clickable' || refData.role === 'focusable') {
    return page.locator(refData.selector);
  }

  // Build ARIA role-based locator
  let locator = page.getByRole(refData.role as any);

  if (refData.name) {
    locator = locator.filter({ hasText: refData.name });
  }

  if (refData.nth !== undefined) {
    locator = locator.nth(refData.nth);
  }

  return locator;
}

/**
 * Resolve ref to locator with validation
 */
export function resolveRef(
  page: Page,
  ref: string,
  refMap: RefMap
): Locator {
  const refId = parseRef(ref);

  if (!refId) {
    throw new Error(
      `Invalid ref format: "${ref}". ` +
      `Refs must be in format "e1" or "@e1".`
    );
  }

  const refData = refMap[refId];

  if (!refData) {
    const available = Object.keys(refMap).sort();
    throw new Error(
      `Ref "${ref}" not found. ` +
      `Available refs: ${available.slice(0, 10).join(', ')}${available.length > 10 ? '...' : ''}`
    );
  }

  return locatorFromRef(page, refData);
}
