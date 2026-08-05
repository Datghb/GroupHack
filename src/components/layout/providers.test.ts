import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const readSource = (relativePath: string) =>
  readFileSync(new URL(relativePath, import.meta.url), 'utf8');

describe('provider bundle boundaries', () => {
  it('keeps React Query out of the root provider used by auth pages', () => {
    expect(readSource('./providers.tsx')).not.toContain("'./query-provider'");
  });

  it.each([
    '../../app/dashboard/layout.tsx',
    '../../app/student/layout.tsx',
    '../../app/teacher/layout.tsx'
  ])('mounts React Query within authenticated layout %s', (layoutPath) => {
    expect(readSource(layoutPath)).toContain('QueryProvider');
  });
});
