import { Icons } from '@/components/icons';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import type { CheckpointRecord, TeamProgressRecord } from '../api/assignment-types';

interface MemberCheckpointProgressProps {
  checkpoints: CheckpointRecord[];
  members: NonNullable<TeamProgressRecord['memberProgress']>;
}

export function MemberCheckpointProgress({ checkpoints, members }: MemberCheckpointProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tiến độ thành viên nhóm</CardTitle>
        <CardDescription>
          Mọi thành viên đều xem được tiến độ. Checkpoint nhóm chỉ hoàn thành khi cả nhóm đã tick.
        </CardDescription>
      </CardHeader>
      <CardContent className='overflow-x-auto'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Thành viên</TableHead>
              {checkpoints.map((checkpoint, index) => (
                <TableHead key={checkpoint.id} className='min-w-24 text-center'>
                  <div className='flex flex-col items-center gap-1'>
                    <span>CP{index + 1}</span>
                    <Badge variant={checkpoint.scope === 'TEAM' ? 'secondary' : 'outline'}>
                      {checkpoint.scope === 'TEAM' ? 'Nhóm' : 'Cá nhân'}
                    </Badge>
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {members.map((member) => (
              <TableRow key={member.id}>
                <TableCell>
                  <div className='flex min-w-44 items-center gap-2'>
                    <Avatar size='sm'>
                      <AvatarImage src={member.avatarUrl ?? ''} alt={member.fullName} />
                      <AvatarFallback>{member.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className='font-medium'>{member.fullName}</span>
                  </div>
                </TableCell>
                {checkpoints.map((checkpoint) => {
                  const completed = member.completedCheckpointIds.includes(checkpoint.id);
                  return (
                    <TableCell key={checkpoint.id} className='text-center'>
                      <span
                        className={cn(
                          'inline-flex size-7 items-center justify-center rounded-full',
                          completed
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                        )}
                        aria-label={`${member.fullName}: ${completed ? 'đã hoàn thành' : 'chưa hoàn thành'} ${checkpoint.title}`}
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
  );
}
