import PageContainer from '@/components/layout/page-container';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Icons } from '@/components/icons';
import { ActivityList } from '@/features/classroom/components/activity-list';
import { StatCard } from '@/features/classroom/components/stat-card';
import { TeamMonitor } from '@/features/classroom/components/team-monitor';

export default function TeacherDashboardPage() {
  return (
    <PageContainer
      pageTitle='Chào buổi sáng, giảng viên'
      pageDescription='Nắm bắt nhịp độ của các lớp và hỗ trợ nhóm cần chú ý.'
    >
      <div className='flex flex-col gap-4'>
        <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
          <StatCard
            title='Lớp đang hoạt động'
            value='3'
            description='83 sinh viên đang tham gia'
            icon={Icons.workspace}
          />
          <StatCard
            title='Nhóm sinh viên'
            value='15'
            description='12 nhóm hoạt động tuần này'
            icon={Icons.teams}
          />
          <StatCard
            title='Chờ duyệt'
            value='7'
            description='3 bài nộp mới hôm nay'
            icon={Icons.checks}
          />
          <StatCard
            title='Nhóm cần chú ý'
            value='4'
            description='2 trễ hạn · 2 không hoạt động'
            icon={Icons.warning}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Nhịp độ bài tập đang diễn ra</CardTitle>
            <CardDescription>Sản phẩm cộng đồng số · Phát triển Web hiện đại</CardDescription>
          </CardHeader>
          <CardContent>
            <TeamMonitor />
          </CardContent>
        </Card>
        <Card id='activity'>
          <CardHeader>
            <CardTitle>Hoạt động gần đây</CardTitle>
            <CardDescription>Các cập nhật quan trọng từ sinh viên và giảng viên.</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityList />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
