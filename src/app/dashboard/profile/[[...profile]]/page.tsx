import PageContainer from '@/components/layout/page-container';
import ProfileViewPage from '@/features/profile/components/profile-view-page';

export const metadata = {
  title: 'Hồ sơ cá nhân'
};

export default async function Page() {
  return (
    <PageContainer
      pageTitle='Hồ sơ cá nhân'
      pageDescription='Quản lý thông tin cá nhân và tài khoản của bạn.'
    >
      <ProfileViewPage />
    </PageContainer>
  );
}
