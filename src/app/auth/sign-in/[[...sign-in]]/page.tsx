import { Metadata } from 'next';
import SignInViewPage from '@/features/auth/components/sign-in-view';

export const metadata: Metadata = {
  title: 'Đăng nhập',
  description: 'Đăng nhập vào nền tảng theo dõi tiến độ lớp học.'
};

export default async function Page() {
  return <SignInViewPage />;
}
