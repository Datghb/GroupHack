import { describe, expect, it } from 'vitest';
import { getCheckpointTitle } from './checkpoint-label';

describe('getCheckpointTitle', () => {
  it('creates a one-based checkpoint title from its zero-based position', () => {
    expect(getCheckpointTitle(0)).toBe('Checkpoint 1');
    expect(getCheckpointTitle(3)).toBe('Checkpoint 4');
  });
});
