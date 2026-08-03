'use client';

import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { assignmentProgressQueryOptions } from '../api/assignment-queries';

export function TeamMonitor({ classId, assignmentId }: { classId: string; assignmentId: string }) {
  const {
    data = [],
    isPending,
    error
  } = useQuery(assignmentProgressQueryOptions(classId, assignmentId));
  if (isPending) return <Skeleton className='h-48 w-full' />;
  if (error) return <p className='text-destructive'>{error.message}</p>;
  if (!data.length)
    return <p className='rounded-lg border p-6 text-muted-foreground'>Bài tập chưa có nhóm.</p>;
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhóm</TableHead>
            <TableHead>Thành viên</TableHead>
            <TableHead>Checkpoint hiện tại</TableHead>
            <TableHead>Tiến độ</TableHead>
            <TableHead>Trễ hạn</TableHead>
            <TableHead>Hoạt động cuối</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((team) => (
            <TableRow key={team.id}>
              <TableCell className='font-medium'>{team.name}</TableCell>
              <TableCell>{team.memberIds.length}</TableCell>
              <TableCell>{team.currentCheckpoint}</TableCell>
              <TableCell>
                <div className='flex min-w-36 items-center gap-2'>
                  <Progress value={team.progress} />
                  <span className='text-xs tabular-nums'>{team.progress}%</span>
                </div>
              </TableCell>
              <TableCell>{team.lateCheckpoints}</TableCell>
              <TableCell>
                {team.lastActivityAt
                  ? formatDistanceToNow(new Date(team.lastActivityAt), {
                      addSuffix: true,
                      locale: vi
                    })
                  : 'Chưa có'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
