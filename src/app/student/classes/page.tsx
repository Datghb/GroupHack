import PageContainer from '@/components/layout/page-container';
import { StudentDatabaseClasses } from '@/features/classroom/components/database-class-flow';

export default function DiscoverClassesPage() {
  return (
    <PageContainer
      pageTitle='Khám phá lớp học'
      pageDescription='Mở một lớp đang hoạt động và tham gia ngay, không cần mã lớp.'
    >
      <StudentDatabaseClasses />
    </PageContainer>
  );
}
