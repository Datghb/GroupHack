import type { Metadata } from 'next';
import { ClassroomShell } from '@/components/layout/classroom-shell';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { getCurrentUser, requireTeacher } from '@/lib/classroom-auth';

export const metadata: Metadata = { title: 'Giảng viên · Tiến độ lớp học' };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const [, user] = await Promise.all([requireTeacher(), getCurrentUser()]);
  return (
    <CurrentUserProvider initialUser={user}>
      <ClassroomShell>{children}</ClassroomShell>
    </CurrentUserProvider>
  );
}
