import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { Suspense } from 'react';
import PageContainer from '@/components/layout/page-container';
import { getStudentOverviewData } from '@/features/classroom/api/student-overview';
import { studentOverviewKey } from '@/features/classroom/api/student-overview-query';
import { StudentOverview } from '@/features/classroom/components/student-overview';
import { Skeleton } from '@/components/ui/skeleton';
import { requireStudent } from '@/lib/classroom-auth';
import { getQueryClient } from '@/lib/query-client';

export default async function StudentDashboardPage() {
  const userId = await requireStudent();
  const queryClient = getQueryClient();
  void queryClient.prefetchQuery({
    queryKey: studentOverviewKey,
    queryFn: () => getStudentOverviewData(userId)
  });
  return (
    <PageContainer
      pageTitle='Tổng quan'
      pageDescription='Theo dõi lớp, bài tập, nhóm và checkpoint của bạn.'
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<Skeleton className='h-80 w-full' />}>
          <StudentOverview />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
