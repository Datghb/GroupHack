import PageContainer from '@/components/layout/page-container';
import { CommunityProgress } from '@/features/classroom/components/community-progress';

export default function CommunityPage() {
  return (
    <PageContainer
      pageTitle='Tiến độ cộng đồng'
      pageDescription='Theo dõi nhịp độ chung để cùng hỗ trợ nhau — không phải bảng xếp hạng.'
    >
      <CommunityProgress />
    </PageContainer>
  );
}
