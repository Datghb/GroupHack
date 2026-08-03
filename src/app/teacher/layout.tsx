import type { Metadata } from 'next';
import { ClassroomShell } from '@/components/layout/classroom-shell';
import { requireTeacher } from '@/lib/classroom-auth';

export const metadata: Metadata = { title: 'Giảng viên · Tiến độ lớp học' };

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  await requireTeacher();
  return <ClassroomShell>{children}</ClassroomShell>;
}
