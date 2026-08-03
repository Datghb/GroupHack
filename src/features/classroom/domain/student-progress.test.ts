import { describe, expect, test } from 'vitest';
import { calculateCheckpointProgress, isAssignmentCompleted } from './student-progress';

describe('tiến độ checkpoint của học sinh', () => {
  test('trả về 0 khi bài chưa có checkpoint', () => {
    expect(calculateCheckpointProgress(0, 0)).toBe(0);
  });
  test('tính và làm tròn phần trăm hoàn thành', () => {
    expect(calculateCheckpointProgress(2, 3)).toBe(67);
  });
  test('không cho tiến độ vượt quá 100%', () => {
    expect(calculateCheckpointProgress(5, 3)).toBe(100);
  });
  test('chỉ hoàn thành khi có checkpoint và đã làm đủ', () => {
    expect(isAssignmentCompleted(0, 0)).toBe(false);
    expect(isAssignmentCompleted(3, 3)).toBe(true);
  });
});
