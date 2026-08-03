import { redirect } from 'next/navigation';
import { cache } from 'react';
import type { UserRole } from '@/features/classroom/domain/types';
import { createClient } from '@/lib/supabase/server';

const getAuthContext = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (error || !userId) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();

  return {
    userId,
    role: profile?.role === 'TEACHER' ? ('TEACHER' as const) : ('STUDENT' as const)
  };
});

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
