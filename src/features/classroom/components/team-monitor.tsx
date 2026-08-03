import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { assignment, teams } from '../api/data';
import { deriveTeamHealth } from '../domain/progress';
import { StatusBadge } from './status-badge';

export function TeamMonitor() {
  const now = new Date();
  return (
    <div className='overflow-x-auto rounded-lg border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nhóm</TableHead>
            <TableHead>Thành viên</TableHead>
            <TableHead>Checkpoint hiện tại</TableHead>
            <TableHead>Tiến độ</TableHead>
            <TableHead>Hoàn thành</TableHead>
            <TableHead>Trễ</TableHead>
            <TableHead>Hoạt động cuối</TableHead>
            <TableHead>Trạng thái</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {teams.map((team) => {
            const health = deriveTeamHealth({
              assignment,
              progress: team.progress,
              lateCheckpoints: team.lateCheckpoints,
              completedCheckpoints: team.completedCheckpoints,
              lastActivityAt: team.lastActivityAt,
              now
            });
            return (
              <TableRow key={team.id}>
                <TableCell className='font-medium'>{team.name}</TableCell>
                <TableCell>{team.memberIds.length}</TableCell>
                <TableCell>{team.currentCheckpoint}</TableCell>
                <TableCell>
                  <div className='flex min-w-32 items-center gap-2'>
                    <Progress value={team.progress} />
                    <span className='text-xs tabular-nums'>{team.progress}%</span>
                  </div>
                </TableCell>
                <TableCell>
                  {team.completedCheckpoints}/{team.totalCheckpoints}
                </TableCell>
                <TableCell>{team.lateCheckpoints}</TableCell>
                <TableCell>
                  {formatDistanceToNow(team.lastActivityAt, { addSuffix: true, locale: vi })}
                </TableCell>
                <TableCell>
                  <StatusBadge status={health} />
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
