import type { Classroom } from '../domain/types';

export interface ClassroomRecord extends Classroom {
  joined: boolean;
}
export interface CreateClassroomPayload {
  name: string;
  description: string;
}
export interface CreateTeamPayload {
  name: string;
  description: string;
  capacity: number;
}
export interface TeamRecord {
  id: string;
  classroomId: string;
  name: string;
  description: string;
  leaderId: string;
  capacity: number;
  open: boolean;
  memberIds: string[];
}
