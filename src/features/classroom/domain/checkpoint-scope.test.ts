import { describe, expect, test } from 'vitest';
import { getCheckpointScopeLabel } from './checkpoint-scope';

describe('nhãn phạm vi checkpoint', () => {
  test('hiển thị đúng nhãn cá nhân', () => {
    expect(getCheckpointScopeLabel('INDIVIDUAL')).toBe('Cá nhân');
  });

  test('hiển thị đúng nhãn nhóm', () => {
    expect(getCheckpointScopeLabel('TEAM')).toBe('Nhóm');
  });
});
