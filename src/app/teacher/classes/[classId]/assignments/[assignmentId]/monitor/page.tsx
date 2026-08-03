import PageContainer from '@/components/layout/page-container';
import { TeamMonitor } from '@/features/classroom/components/team-monitor';

export default async function AssignmentMonitorPage({
  params
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  return (
    <PageContainer
      pageTitle='Theo dõi tiến độ bài tập'
      pageDescription='Dữ liệu hoàn thành checkpoint được cập nhật từ các nhóm sinh viên.'
    >
      <div className='flex flex-col gap-4'>
        <TeamMonitor classId={classId} assignmentId={assignmentId} />
      </div>
    </PageContainer>
  );
}
