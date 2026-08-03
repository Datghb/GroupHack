import 'server-only';
import { createClient } from '@supabase/supabase-js';

export function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serverKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serverKey) {
    throw new Error(
      'Thiếu NEXT_PUBLIC_SUPABASE_URL và SUPABASE_SECRET_KEY (hoặc SUPABASE_SERVICE_ROLE_KEY).'
    );
  }
  return createClient(url, serverKey, {
    auth: { persistSession: false, autoRefreshToken: false }
  });
}
