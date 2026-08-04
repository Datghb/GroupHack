import { createClient } from '@/lib/supabase/server';
export async function getApiAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return { userId: null, role: null } as const;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', userId)
    .single();
  return {
    userId,
    role: String(profile?.role).toUpperCase() === 'TEACHER' ? 'TEACHER' : 'STUDENT'
  } as const;
}
