import PageContainer from '@/components/layout/page-container';
import { StudentAssignmentList } from '@/features/classroom/components/assignment-workspace';
export default async function StudentClassPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return (
    <PageContainer
      pageTitle='Bài tập của lớp'
      pageDescription='Chọn bài tập để xem checkpoint, tạo hoặc tham gia nhóm.'
    >
      <StudentAssignmentList classId={classId} />
    </PageContainer>
  );
}
