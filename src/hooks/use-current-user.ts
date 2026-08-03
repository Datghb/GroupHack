'use client';
import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  imageUrl?: string;
  role: 'TEACHER' | 'STUDENT';
}
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null);
  useEffect(() => {
    const supabase = createClient();
    async function load(authUser?: User | null) {
      const resolved = authUser ?? (await supabase.auth.getUser()).data.user;
      if (!resolved) return setUser(null);
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', resolved.id)
        .single();
      setUser({
        id: resolved.id,
        email: resolved.email ?? '',
        fullName:
          profile?.full_name || resolved.user_metadata.full_name || resolved.email || 'Người dùng',
        imageUrl: resolved.user_metadata.avatar_url,
        role: profile?.role === 'TEACHER' ? 'TEACHER' : 'STUDENT'
      });
    }
    void load();
    const { data } = supabase.auth.onAuthStateChange((_event, session) => void load(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return { user };
}
