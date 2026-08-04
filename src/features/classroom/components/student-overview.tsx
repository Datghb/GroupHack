'use client';

import Link from 'next/link';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { StatCard } from './stat-card';

import type { StudentOverviewData } from '../api/student-overview';
import { studentOverviewKey } from '../api/student-overview-query';
async function getStudentOverview(): Promise<StudentOverviewData> {
  const response = await fetch('/api/student/overview');
  const body = (await response.json()) as { data?: StudentOverviewData; error?: string };
  if (!response.ok || !body.data) throw new Error(body.error ?? 'Không thể tải tổng quan.');
  return body.data;
}

export function StudentOverview() {
  const { data } = useSuspenseQuery({
    queryKey: studentOverviewKey,
    queryFn: getStudentOverview
  });
  return (
    <div className='space-y-4'>
      <div className='grid gap-4 sm:grid-cols-2 xl:grid-cols-4'>
        <StatCard
          title='Lớp đang học'
          value={String(data.classCount)}
          description='Các lớp đã tham gia'
          icon={Icons.workspace}
        />
        <StatCard
          title='Bài tập'
          value={String(data.assignmentCount)}
          description='Trong khóa đang chọn'
          icon={Icons.checks}
        />
        <StatCard
          title='Nhóm của tôi'
          value={String(data.teamCount)}
          description='Theo từng bài tập'
          icon={Icons.teams}
        />
        <StatCard
          title='Đã hoàn thành'
          value={String(data.completedCount)}
          description='Bài đã xong checkpoint'
          icon={Icons.check}
        />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ bài tập của tôi</CardTitle>
          <CardDescription>Dữ liệu lấy từ khóa học và nhóm bạn đang tham gia.</CardDescription>
        </CardHeader>
        <CardContent className='grid gap-3 md:grid-cols-2'>
          {data.assignments.length ? (
            data.assignments.map((assignment) => (
              <div key={assignment.id} className='space-y-3 rounded-lg border p-4'>
                <div className='flex items-start justify-between gap-3'>
                  <div>
                    <p className='font-medium'>{assignment.title}</p>
                    <p className='text-sm text-muted-foreground'>
                      {assignment.className}
                      {assignment.dueAt
                        ? ` · Hạn ${new Date(assignment.dueAt).toLocaleDateString('vi-VN')}`
                        : ''}
                    </p>
                  </div>
                  <Badge variant={assignment.hasTeam ? 'secondary' : 'outline'}>
                    {assignment.hasTeam ? 'Đã có nhóm' : 'Chưa có nhóm'}
                  </Badge>
                </div>
                <div className='flex items-center gap-2'>
                  <Progress value={assignment.progress} />
                  <span className='text-xs tabular-nums'>
                    {assignment.completed}/{assignment.total}
                  </span>
                </div>
                <Button
                  size='sm'
                  variant='outline'
                  render={
                    <Link
                      href={`/student/classes/${assignment.classId}/assignments/${assignment.id}`}
                      aria-label={`Mở bài tập ${assignment.title}`}
                    />
                  }
                >
                  Mở bài tập
                </Button>
              </div>
            ))
          ) : (
            <div className='space-y-3'>
              <p className='text-muted-foreground'>Chưa có bài tập trong các khóa đang học.</p>
              <Button render={<Link href='/student/classes' aria-label='Mở danh sách lớp học' />}>
                Mở lớp học
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
