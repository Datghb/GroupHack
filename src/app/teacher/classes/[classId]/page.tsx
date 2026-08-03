import PageContainer from '@/components/layout/page-container';
import { TeacherAssignmentManager } from '@/features/classroom/components/assignment-workspace';
import { TeacherDatabaseClassDetail } from '@/features/classroom/components/database-class-flow';
export default async function TeacherClassPage({
  params
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  return (
    <PageContainer
      pageTitle='Quản lý lớp học'
      pageDescription='Tạo bài tập và thiết kế checkpoint cho học sinh.'
    >
      <div className='space-y-6'>
        <TeacherDatabaseClassDetail classId={classId} />
        <TeacherAssignmentManager classId={classId} />
      </div>
    </PageContainer>
  );
}
