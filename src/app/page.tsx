import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function Page() {
  const { data } = await (await createClient()).auth.getUser();
  redirect(data.user ? '/dashboard' : '/auth/sign-in');
}
