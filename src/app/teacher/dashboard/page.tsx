import PageContainer from '@/components/layout/page-container';
import { TeacherOverview } from '@/features/classroom/components/teacher-overview';

export default function TeacherDashboardPage() {
  return (
    <PageContainer
      pageTitle='Tổng quan giảng viên'
      pageDescription='Số liệu trực tiếp từ các lớp, bài tập và nhóm của bạn.'
    >
      <TeacherOverview />
    </PageContainer>
  );
}
