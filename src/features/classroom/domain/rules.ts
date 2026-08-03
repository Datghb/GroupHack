import type { Classroom, Checkpoint, ClassroomUser, ProgressRecord, Team } from './types';

export interface Enrollment {
  classroomId: string;
  studentId: string;
}

export function joinClassroom(
  actor: ClassroomUser,
  classroom: Classroom,
  enrollments: Enrollment[]
): Enrollment[] {
  if (actor.role !== 'STUDENT') throw new Error('Chỉ sinh viên mới có thể tham gia lớp.');
  if (classroom.archived) throw new Error('Lớp học đã được lưu trữ.');
  if (
    enrollments.some((item) => item.classroomId === classroom.id && item.studentId === actor.id)
  ) {
    throw new Error('Bạn đã tham gia lớp học này.');
  }
  return [...enrollments, { classroomId: classroom.id, studentId: actor.id }];
}

export function joinTeam(actorId: string, team: Team, teams: Team[]): Team {
  const hasTeamInClass = teams.some(
    (item) => item.classroomId === team.classroomId && item.memberIds.includes(actorId)
  );
  if (hasTeamInClass) throw new Error('Mỗi sinh viên chỉ được tham gia một nhóm trong lớp.');
  if (!team.open || team.archived) throw new Error('Nhóm hiện không nhận thành viên.');
  if (team.memberIds.length >= team.capacity) throw new Error('Nhóm đã đủ thành viên.');
  return { ...team, memberIds: [...team.memberIds, actorId] };
}

export function assertCanSubmitTeamCheckpoint(actorId: string, team: Team): void {
  if (team.leaderId !== actorId) throw new Error('Chỉ trưởng nhóm mới có thể nộp checkpoint nhóm.');
}

export function assertCanUpdatePersonalProgress(
  actorId: string,
  progress: ProgressRecord,
  checkpoint: Checkpoint
): void {
  if (checkpoint.type !== 'INDIVIDUAL' || progress.ownerId !== actorId) {
    throw new Error('Bạn không thể cập nhật tiến độ cá nhân của người khác.');
  }
}

export function assertCanEditClass(actorId: string, classroom: Classroom): void {
  if (classroom.teacherId !== actorId) throw new Error('Bạn không sở hữu lớp học này.');
}
