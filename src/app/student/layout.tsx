import type { Metadata } from 'next';
import { ClassroomShell } from '@/components/layout/classroom-shell';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { getCurrentUser, requireStudent } from '@/lib/classroom-auth';

export const metadata: Metadata = { title: 'Sinh viên · Tiến độ nhóm' };

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const [, user] = await Promise.all([requireStudent(), getCurrentUser()]);
  return (
    <CurrentUserProvider initialUser={user}>
      <ClassroomShell>{children}</ClassroomShell>
    </CurrentUserProvider>
  );
}
