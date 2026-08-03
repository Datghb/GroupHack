import { describe, expect, test } from 'vitest';
import { toIsoDateTime, toLocalDateTime } from './assignment-dates';

describe('assignment deadline conversion', () => {
  test('preserves an empty optional deadline', () => {
    expect(toLocalDateTime(null)).toBe('');
    expect(toIsoDateTime('')).toBe('');
  });

  test('round-trips a stored deadline without changing the instant', () => {
    const storedDeadline = '2026-08-03T10:30:00.000Z';

    expect(toIsoDateTime(toLocalDateTime(storedDeadline))).toBe(storedDeadline);
  });
});
