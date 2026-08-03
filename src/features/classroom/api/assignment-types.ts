export interface CheckpointRecord {
  id: string;
  title: string;
  description: string;
  dueAt: string | null;
  position: number;
}
export interface AssignmentRecord {
  id: string;
  classroomId: string;
  title: string;
  description: string;
  dueAt: string | null;
  checkpoints: CheckpointRecord[];
}
export interface AssignmentTeamRecord {
  id: string;
  name: string;
  description: string;
  leaderId: string;
  capacity: number;
  open: boolean;
  memberIds: string[];
}
export interface CreateAssignmentPayload {
  title: string;
  description: string;
  dueAt: string;
  checkpoints: Array<{ title: string; description: string; dueAt: string }>;
}
