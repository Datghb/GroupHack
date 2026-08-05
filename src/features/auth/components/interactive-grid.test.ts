import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('InteractiveGridPattern client boundary', () => {
  it('keeps the large SVG out of the RSC payload without restoring per-cell state handlers', () => {
    const source = readFileSync(new URL('./interactive-grid.tsx', import.meta.url), 'utf8');

    expect(source.trimStart()).toMatch(/^'use client';/);
    expect(source).toContain('hover:fill-gray-300/30');
    expect(source).not.toContain('useState');
    expect(source).not.toContain('onMouseEnter');
    expect(source).not.toContain('onMouseLeave');
  });
});
