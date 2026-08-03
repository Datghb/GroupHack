import PageContainer from '@/components/layout/page-container';
import { StudentDatabaseClasses } from '@/features/classroom/components/database-class-flow';

export default function StudentDashboardPage() {
  return (
    <PageContainer
      pageTitle='Lớp học dành cho bạn'
      pageDescription='Chọn một lớp do giáo viên tạo, tham gia lớp rồi tạo hoặc tham gia nhóm.'
    >
      <StudentDatabaseClasses />
    </PageContainer>
  );
}
