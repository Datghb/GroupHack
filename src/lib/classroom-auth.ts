import { redirect } from 'next/navigation';
import type { UserRole } from '@/features/classroom/domain/types';
import { createClient } from '@/lib/supabase/server';

export async function requireAuthenticatedUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect('/auth/sign-in');
  return data.user.id;
}

export async function getUserRole(): Promise<UserRole> {
  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return 'STUDENT';
  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userData.user.id)
    .single();
  return data?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT';
}

export async function requireRole(role: UserRole): Promise<string> {
  const [userId, actualRole] = await Promise.all([requireAuthenticatedUser(), getUserRole()]);
  if (actualRole !== role)
    redirect(actualRole === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
  return userId;
}

export const requireTeacher = () => requireRole('TEACHER');
export const requireStudent = () => requireRole('STUDENT');
