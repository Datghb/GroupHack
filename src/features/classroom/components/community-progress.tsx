'use client';

import { useQuery } from '@tanstack/react-query';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent
} from '@/components/ui/chart';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { assignmentProgressQueryOptions, assignmentQueryOptions } from '../api/assignment-queries';

const config = {
  progress: { label: 'Tiến độ', color: 'var(--chart-1)' }
} satisfies ChartConfig;

export function CommunityProgress({
  classId,
  assignmentId
}: {
  classId: string;
  assignmentId: string;
}) {
  const assignmentQuery = useQuery(assignmentQueryOptions(classId, assignmentId));
  const progressQuery = useQuery(assignmentProgressQueryOptions(classId, assignmentId));
  if (assignmentQuery.isPending || progressQuery.isPending)
    return <Skeleton className='h-80 w-full' />;
  const error = assignmentQuery.error ?? progressQuery.error;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  const assignment = assignmentQuery.data;
  const teams = progressQuery.data ?? [];
  if (!assignment) return <p className='text-destructive'>Không tìm thấy bài tập.</p>;
  if (!teams.length)
    return (
      <Card>
        <CardHeader>
          <CardTitle>Chưa có nhóm</CardTitle>
          <CardDescription>Chưa có nhóm nào tham gia bài tập này.</CardDescription>
        </CardHeader>
      </Card>
    );
  return (
    <div className='grid gap-4 xl:grid-cols-2'>
      <Card>
        <CardHeader>
          <CardTitle>Tiến độ các nhóm</CardTitle>
          <CardDescription>
            Tỷ lệ checkpoint đã hoàn thành, không phải bảng xếp hạng.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={config} className='h-72 w-full'>
            <BarChart accessibilityLayer data={teams} layout='vertical' margin={{ left: 16 }}>
              <CartesianGrid horizontal={false} />
              <XAxis type='number' domain={[0, 100]} tickFormatter={(value) => `${value}%`} />
              <YAxis dataKey='name' type='category' tickLine={false} axisLine={false} width={88} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey='progress' fill='var(--color-progress)' radius={4} />
            </BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Ma trận checkpoint</CardTitle>
          <CardDescription>Trạng thái công khai của từng nhóm theo checkpoint.</CardDescription>
        </CardHeader>
        <CardContent className='overflow-x-auto'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nhóm</TableHead>
                {assignment.checkpoints.map((checkpoint, index) => (
                  <TableHead key={checkpoint.id} className='text-center' title={checkpoint.title}>
                    <div className='flex flex-col items-center gap-1'>
                      <span>CP{index + 1}</span>
                      <Badge variant={checkpoint.scope === 'INDIVIDUAL' ? 'outline' : 'secondary'}>
                        {checkpoint.scope === 'INDIVIDUAL' ? 'Cá nhân' : 'Nhóm'}
                      </Badge>
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {teams.map((team) => (
                <TableRow key={team.id}>
                  <TableCell className='font-medium'>{team.name}</TableCell>
                  {assignment.checkpoints.map((checkpoint) => {
                    const completed = team.completedCheckpointIds.includes(checkpoint.id);
                    return (
                      <TableCell key={checkpoint.id} className='text-center'>
                        <span
                          className={cn(
                            'inline-flex size-7 items-center justify-center rounded-full',
                            completed
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted text-muted-foreground'
                          )}
                          aria-label={completed ? 'Đã hoàn thành' : 'Chưa hoàn thành'}
                        >
                          {completed ? <Icons.check /> : '○'}
                        </span>
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
