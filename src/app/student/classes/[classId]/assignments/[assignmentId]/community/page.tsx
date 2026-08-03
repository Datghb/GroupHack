import PageContainer from '@/components/layout/page-container';
import { CommunityProgress } from '@/features/classroom/components/community-progress';

export default async function CommunityPage({
  params
}: {
  params: Promise<{ classId: string; assignmentId: string }>;
}) {
  const { classId, assignmentId } = await params;
  return (
    <PageContainer
      pageTitle='Tiến độ cộng đồng'
      pageDescription='Theo dõi nhịp độ chung để cùng hỗ trợ nhau — không phải bảng xếp hạng.'
    >
      <CommunityProgress classId={classId} assignmentId={assignmentId} />
    </PageContainer>
  );
}
