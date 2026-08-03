import PageContainer from '@/components/layout/page-container';
import { StudentAssignmentWorkspace } from '@/features/classroom/components/assignment-workspace';
export default async function StudentAssignmentPage({
  params
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  return (
    <PageContainer
      pageTitle='Chi tiết bài tập'
      pageDescription='Theo dõi checkpoint và làm việc cùng nhóm của bài tập.'
    >
      <StudentAssignmentWorkspace classId={classId} assignmentId={assignmentId} />
    </PageContainer>
  );
}
