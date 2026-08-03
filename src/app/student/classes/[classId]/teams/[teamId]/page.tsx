import PageContainer from '@/components/layout/page-container';
import { StudentTeamWorkspace } from '@/features/classroom/components/student-class-flow';

export default async function TeamWorkspacePage({
  params
}: {
  params: Promise<{ classId: string; teamId: string }>;
}) {
  const { classId, teamId } = await params;
  return (
    <PageContainer
      pageTitle='Không gian nhóm'
      pageDescription='Theo dõi thành viên, vai trò và tiến độ của nhóm trong lớp.'
    >
      <StudentTeamWorkspace classroomId={classId} teamId={teamId} />
    </PageContainer>
  );
}
