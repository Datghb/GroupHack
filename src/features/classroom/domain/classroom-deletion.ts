export function canDeleteClassroom(
  role: 'TEACHER' | 'STUDENT' | null,
  classroomTeacherId: string,
  userId: string
): boolean {
  return role === 'TEACHER' && classroomTeacherId === userId;
}
