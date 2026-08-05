import { BrandLogo } from '@/components/brand-logo';
import { cn } from '@/lib/utils';
import { Metadata } from 'next';
import { InteractiveGridPattern } from './interactive-grid';
import { SupabaseAuthForm } from './supabase-auth-form';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào nền tảng theo dõi tiến độ lớp học.'
};

export default function SignInViewPage() {
  return (
    <div className='relative flex min-h-screen flex-col items-center justify-center overflow-hidden md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <div className='relative hidden h-full flex-col p-10 lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-sidebar' />
        <div className='text-sidebar-foreground relative z-20 flex items-center text-lg font-medium'>
          <BrandLogo className='mr-3 size-12' priority />
          <span>VICheck · Tiến độ lớp học</span>
        </div>
        <InteractiveGridPattern
          className={cn(
            'mask-[radial-gradient(400px_circle_at_center,white,transparent)]',
            'inset-x-0 inset-y-[0%] h-full skew-y-12'
          )}
        />
        <div className='text-sidebar-foreground relative z-20 mt-auto'>
          <blockquote className='space-y-2'>
            <p className='text-lg'>
              &ldquo;Mỗi checkpoint rõ ràng giúp sinh viên chủ động hơn và giúp giảng viên hỗ trợ
              đúng lúc.&rdquo;
            </p>
            <footer className='text-sidebar-foreground/70 text-sm'>Không gian lớp học số</footer>
          </blockquote>
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          <SupabaseAuthForm mode='sign-in' />
        </div>
      </div>
    </div>
  );
}
