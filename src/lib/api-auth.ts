import { createClient } from '@/lib/supabase/server';
export async function getApiAuth() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) return { userId: null, role: null } as const;
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .single();
  return {
    userId: data.user.id,
    role: profile?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'
  } as const;
}
