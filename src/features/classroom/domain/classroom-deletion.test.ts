import { describe, expect, it } from 'vitest';
import { canDeleteClassroom } from './classroom-deletion';

describe('canDeleteClassroom', () => {
  it('allows the teacher who owns the classroom', () => {
    expect(canDeleteClassroom('TEACHER', 'teacher-1', 'teacher-1')).toBe(true);
  });

  it('rejects a different teacher', () => {
    expect(canDeleteClassroom('TEACHER', 'teacher-2', 'teacher-1')).toBe(false);
  });

  it('rejects students even when ids match', () => {
    expect(canDeleteClassroom('STUDENT', 'student-1', 'student-1')).toBe(false);
  });

  it('rejects missing roles', () => {
    expect(canDeleteClassroom(null, 'teacher-1', 'teacher-1')).toBe(false);
  });
});
