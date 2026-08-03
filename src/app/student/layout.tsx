import type { Metadata } from 'next';
import { ClassroomShell } from '@/components/layout/classroom-shell';
import { requireStudent } from '@/lib/classroom-auth';

export const metadata: Metadata = { title: 'Sinh viên · Tiến độ nhóm' };

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireStudent();
  return <ClassroomShell>{children}</ClassroomShell>;
}
