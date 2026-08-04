import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { UserRole } from '@/features/classroom/domain/types';
import type { CurrentUser } from '@/hooks/use-current-user';
import { createClient } from '@/lib/supabase/server';

const getAuthContext = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name, role')
    .eq('id', userId)
    .single();

  return {
    userId,
    email: typeof data.claims.email === 'string' ? data.claims.email : '',
    fullName:
      profile?.full_name ||
      (typeof data.claims.email === 'string' ? data.claims.email : 'Người dùng'),
    role:
      String(profile?.role).toUpperCase() === 'TEACHER'
        ? ('TEACHER' as const)
        : ('STUDENT' as const)
  };
});

export async function getCurrentUser(): Promise<CurrentUser | null> {
  const context = await getAuthContext();
  if (!context) return null;
  return {
    id: context.userId,
    email: context.email,
    fullName: context.fullName,
    role: context.role
  };
}

export async function requireAuthenticatedUser(): Promise<string> {
  const context = await getAuthContext();
  if (!context) redirect('/auth/sign-in');
  return context.userId;
}

export async function getUserRole(): Promise<UserRole> {
  return (await getAuthContext())?.role ?? 'STUDENT';
}

export async function requireRole(role: UserRole): Promise<string> {
  const context = await getAuthContext();
  if (!context) redirect('/auth/sign-in');
  if (context.role !== role)
    redirect(context.role === 'TEACHER' ? '/teacher/dashboard' : '/student/dashboard');
  return context.userId;
}

export const requireTeacher = () => requireRole('TEACHER');
export const requireStudent = () => requireRole('STUDENT');
