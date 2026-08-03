'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatCard } from './stat-card';

interface OverviewData {
  classCount: number;
  studentCount: number;
  teamCount: number;
  assignmentCount: number;
  assignments: Array<{
    id: string;
    classId: string;
    title: string;
    className: string;
    totalCheckpoints: number;
    activeTeamCount: number;
  }>;
}

async function getOverview(): Promise<OverviewData> {
  const response = await fetch('/api/teacher/overview');
  const body = (await response.json()) as {
    data?: OverviewData;
    error?: string;
  };
  if (!response.ok || !body.data) throw new Error(body.error ?? 'Không thể tải tổng quan.');
  return body.data;
}

export function TeacherOverview() {
  const { data, isPending, error } = useQuery({
    queryKey: ['teacher-overview'],
    queryFn: getOverview
  });
  if (isPending) return <Skeleton className='h-80 w-full' />;
  if (error || !data)
    return <p className='text-destructive'>{error?.message ?? 'Không thể tải dữ liệu.'}</p>;
  return (
    <div className='flex flex-col gap-4'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Lớp đang hoạt động'
          value={String(data.classCount)}
          description={`${data.studentCount} học sinh`}
          icon={Icons.workspace}
        />
        <StatCard
          title='Nhóm bài tập'
          value={String(data.teamCount)}
          description='Được tạo trong các bài tập'
          icon={Icons.teams}
        />
        <StatCard
          title='Bài tập'
          value={String(data.assignmentCount)}
          description='Trong các lớp của bạn'
          icon={Icons.checks}
        />
        <StatCard
          title='Học sinh'
          value={String(data.studentCount)}
          description='Đã tham gia lớp'
          icon={Icons.account}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Bài tập gần đây</CardTitle>
          <CardDescription>Chọn một bài để xem tiến độ thực tế của từng nhóm.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          {data.assignments.length ? (
            data.assignments.map((assignment) => (
              <div
                key={assignment.id}
                className='flex items-center justify-between gap-3 rounded-lg border p-4'
              >
                <div>
                  <p className='font-medium'>{assignment.title}</p>
                  <p className='text-sm text-muted-foreground'>
                    {assignment.className} · {assignment.totalCheckpoints} checkpoint ·{' '}
                    {assignment.activeTeamCount} nhóm đã cập nhật
                  </p>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  render={
                    <Link
                      href={`/teacher/classes/${assignment.classId}/assignments/${assignment.id}/monitor`}
                      aria-label={`Theo dõi tiến độ bài tập ${assignment.title}`}
                    />
                  }
                >
                  Theo dõi
                </Button>
              </div>
            ))
          ) : (
            <p className='text-muted-foreground'>
              Chưa có bài tập. Hãy vào Lớp học để tạo bài đầu tiên.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
