import type { SupabaseClient } from '@supabase/supabase-js';

export async function createAuthClient(): Promise<SupabaseClient> {
  const { createClient } = await import('@/lib/supabase/client');
  return createClient();
}
