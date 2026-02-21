import type { RefMap } from '../browser/snapshot.js';

export interface RefData {
  selector: string;
  role: string;
  name?: string;
  nth?: number;
}

export class RefCacheManager {
  private refs: RefMap = {};
  private version: number = 0;

  /**
   * Update refs from a new snapshot
   */
  updateRefs(refs: RefMap): void {
    this.refs = refs;
    this.version++;
  }

  /**
   * Get ref data by ID
   */
  get(refId: string): RefData | null {
    return this.refs[refId] || null;
  }

  /**
   * Check if ref exists
   */
  isValid(refId: string): boolean {
    return refId in this.refs;
  }

  /**
   * Get all available ref IDs
   */
  getAvailable(): string[] {
    return Object.keys(this.refs);
  }

  /**
   * Get current version (increments on each snapshot)
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Clear all refs (call on navigation)
   */
  invalidate(): void {
    this.refs = {};
    this.version = 0;
  }

  /**
   * Get complete ref map
   */
  getRefMap(): RefMap {
    return { ...this.refs };
  }
}
