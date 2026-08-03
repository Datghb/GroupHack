'use client';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
export function SignOutButton({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  return (
    <button
      type='button'
      className='contents'
      onClick={async () => {
        await createClient().auth.signOut();
        router.replace('/auth/sign-in');
        router.refresh();
      }}
    >
      {children}
    </button>
  );
}
