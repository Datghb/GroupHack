import PageContainer from '@/components/layout/page-container';
import { StudentOverview } from '@/features/classroom/components/student-overview';

export default function StudentDashboardPage() {
  return (
    <PageContainer
      pageTitle='Tổng quan'
      pageDescription='Theo dõi lớp, bài tập, nhóm và checkpoint của bạn.'
    >
      <StudentOverview />
    </PageContainer>
  );
}
