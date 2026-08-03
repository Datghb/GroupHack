import { redirect } from 'next/navigation';
import { getUserRole, requireAuthenticatedUser } from '@/lib/classroom-auth';

export default async function Dashboard() {
  await requireAuthenticatedUser();
  const role = await getUserRole();
  redirect(role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
}
