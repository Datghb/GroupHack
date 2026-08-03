import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const requestedPath = url.searchParams.get('next');
  const nextPath =
    requestedPath?.startsWith('/') && !requestedPath.startsWith('//')
      ? requestedPath
      : '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(nextPath, url.origin));
  }

  const errorUrl = new URL('/auth/sign-in', url.origin);
  errorUrl.searchParams.set('error', 'Không thể đăng nhập bằng Google. Vui lòng thử lại.');
  return NextResponse.redirect(errorUrl);
}
