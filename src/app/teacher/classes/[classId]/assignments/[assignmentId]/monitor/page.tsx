import PageContainer from '@/components/layout/page-container';
import { CommunityProgress } from '@/features/classroom/components/community-progress';
import { TeamMonitor } from '@/features/classroom/components/team-monitor';

export default function AssignmentMonitorPage() {
  return (
    <PageContainer
      pageTitle='Theo dõi · Sản phẩm cộng đồng số'
      pageDescription='Theo dõi tiến độ nhóm theo thời gian thực và phát hiện nhóm cần hỗ trợ.'
    >
      <div className='flex flex-col gap-4'>
        <TeamMonitor />
        <CommunityProgress />
      </div>
    </PageContainer>
  );
}
