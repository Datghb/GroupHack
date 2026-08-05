interface ClassroomSummaryRow {
  id: string;
  name: string;
}

interface EnrollmentSummaryRow {
  student_id: string;
}

interface AssignmentSummaryRow {
  id: string;
  title: string;
  classroom_id: string;
}

interface TeamSummaryRow {
  id: string;
}

interface CheckpointSummaryRow {
  assignment_id: string;
}

interface CompletionSummaryRow {
  assignment_id: string;
  team_id: string;
}

interface TeacherOverviewInput {
  classes: ClassroomSummaryRow[];
  enrollments: EnrollmentSummaryRow[];
  assignmentCount: number;
  recentAssignments: AssignmentSummaryRow[];
  teams: TeamSummaryRow[];
  checkpoints: CheckpointSummaryRow[];
  completions: CompletionSummaryRow[];
}

interface TeacherOverviewAssignment {
  id: string;
  classId: string;
  title: string;
  className: string;
  totalCheckpoints: number;
  activeTeamCount: number;
}

interface TeacherOverviewData {
  classCount: number;
  studentCount: number;
  teamCount: number;
  assignmentCount: number;
  assignments: TeacherOverviewAssignment[];
}

export function buildTeacherOverviewData(input: TeacherOverviewInput): TeacherOverviewData {
  const classNameById = new Map(input.classes.map((item) => [item.id, item.name]));
  const checkpointsByAssignment = Map.groupBy(input.checkpoints, (item) => item.assignment_id);
  const completionsByAssignment = Map.groupBy(input.completions, (item) => item.assignment_id);

  return {
    classCount: input.classes.length,
    studentCount: new Set(input.enrollments.map((item) => item.student_id)).size,
    teamCount: input.teams.length,
    assignmentCount: input.assignmentCount,
    assignments: input.recentAssignments.slice(0, 8).map((assignment) => ({
      id: assignment.id,
      classId: assignment.classroom_id,
      title: assignment.title,
      className: classNameById.get(assignment.classroom_id) ?? 'Lớp học',
      totalCheckpoints: checkpointsByAssignment.get(assignment.id)?.length ?? 0,
      activeTeamCount: new Set(
        (completionsByAssignment.get(assignment.id) ?? []).map((item) => item.team_id)
      ).size
    }))
  };
}
