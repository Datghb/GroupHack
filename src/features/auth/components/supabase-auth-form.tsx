'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Icons } from '@/components/icons';
import { createAuthClient } from '../api/lazy-client';

export function SupabaseAuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const isSignUp = mode === 'sign-up';

  async function handleGoogleSignIn() {
    setPending(true);
    setError('');
    const supabase = await createAuthClient();
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=/dashboard`
      }
    });
    if (oauthError) {
      setError(oauthError.message);
      setPending(false);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const email = String(formData.get('email') ?? '').trim();
    const password = String(formData.get('password') ?? '');
    const fullName = String(formData.get('fullName') ?? '').trim();
    setPending(true);
    setError('');
    const supabase = await createAuthClient();
    const result = isSignUp
      ? await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      : await supabase.auth.signInWithPassword({ email, password });
    setPending(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    if (isSignUp && !result.data.session) {
      toast.success('Đã tạo tài khoản. Vui lòng kiểm tra email để xác nhận.');
      router.push('/auth/sign-in');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className='w-full space-y-4 rounded-xl border bg-card p-6 shadow-sm'
    >
      <div>
        <h1 className='text-2xl font-semibold'>{isSignUp ? 'Tạo tài khoản' : 'Đăng nhập'}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>
          {isSignUp
            ? 'Tài khoản mới được tạo với vai trò học sinh.'
            : 'Đăng nhập bằng tài khoản Supabase.'}
        </p>
      </div>
      <Button
        type='button'
        variant='outline'
        className='w-full'
        disabled={pending}
        onClick={handleGoogleSignIn}
      >
        <Icons.google className='size-4' />
        Tiếp tục với Google
      </Button>
      <div className='flex items-center gap-3 text-xs text-muted-foreground before:h-px before:flex-1 before:bg-border after:h-px after:flex-1 after:bg-border'>
        hoặc dùng email
      </div>
      {isSignUp && (
        <div className='space-y-2'>
          <Label htmlFor='fullName'>Họ và tên</Label>
          <Input id='fullName' name='fullName' required minLength={2} autoComplete='name' />
        </div>
      )}
      <div className='space-y-2'>
        <Label htmlFor='email'>Email</Label>
        <Input id='email' name='email' type='email' required autoComplete='email' />
      </div>
      <div className='space-y-2'>
        <Label htmlFor='password'>Mật khẩu</Label>
        <Input
          id='password'
          name='password'
          type='password'
          required
          minLength={6}
          autoComplete={isSignUp ? 'new-password' : 'current-password'}
        />
      </div>
      {error && <p className='text-sm text-destructive'>{error}</p>}
      <Button type='submit' className='w-full' disabled={pending}>
        {pending ? 'Đang xử lý...' : isSignUp ? 'Đăng ký' : 'Đăng nhập'}
      </Button>
      <p className='text-center text-sm text-muted-foreground'>
        {isSignUp ? 'Đã có tài khoản? ' : 'Chưa có tài khoản? '}
        <Link
          className='text-primary underline'
          href={isSignUp ? '/auth/sign-in' : '/auth/sign-up'}
        >
          {isSignUp ? 'Đăng nhập' : 'Đăng ký'}
        </Link>
      </p>
    </form>
  );
}
