import PageContainer from '@/components/layout/page-container';
import { TeacherDatabaseClasses } from '@/features/classroom/components/database-class-flow';

export default function TeacherClassesPage() {
  return (
    <PageContainer pageTitle='Lớp học' pageDescription='Tạo lớp và quản lý các lớp học của bạn.'>
      <TeacherDatabaseClasses />
    </PageContainer>
  );
}
