import { Metadata } from 'next';
import SignUpViewPage from '@/features/auth/components/sign-up-view';

export const metadata: Metadata = {
  title: 'Đăng ký',
  description: 'Tạo tài khoản trên nền tảng theo dõi tiến độ lớp học.'
};

export default function Page() {
  return <SignUpViewPage />;
}
