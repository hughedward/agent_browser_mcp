import { describe, it, expect } from 'vitest';
import { parseRef } from '../../src/utils/ref-resolver.js';

describe('parseRef', () => {
  it('should parse plain ref format', () => {
    expect(parseRef('e1')).toBe('e1');
    expect(parseRef('e123')).toBe('e123');
  });

  it('should parse @ref format', () => {
    expect(parseRef('@e1')).toBe('e1');
    expect(parseRef('@e123')).toBe('e123');
  });

  it('should reject invalid formats', () => {
    expect(parseRef('ref1')).toBe(null);
    expect(parseRef('@1')).toBe(null);
    expect(parseRef('e')).toBe(null);
    expect(parseRef('')).toBe(null);
  });
});
