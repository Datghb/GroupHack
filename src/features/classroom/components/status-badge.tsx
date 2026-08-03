import { Badge } from '@/components/ui/badge';
import type { ProgressStatus, TeamHealth } from '../domain/types';

const labels: Record<ProgressStatus | TeamHealth, string> = {
  UPCOMING: 'Sắp mở',
  NOT_STARTED: 'Chưa bắt đầu',
  IN_PROGRESS: 'Đang thực hiện',
  SUBMITTED: 'Đã nộp',
  COMPLETED: 'Hoàn thành',
  LATE: 'Trễ hạn',
  MISSED: 'Đã bỏ lỡ',
  ON_TRACK: 'Đúng tiến độ',
  AT_RISK: 'Có nguy cơ',
  INACTIVE: 'Không hoạt động'
};

export function StatusBadge({ status }: { status: ProgressStatus | TeamHealth }) {
  const variant =
    status === 'COMPLETED' || status === 'ON_TRACK'
      ? 'secondary'
      : status === 'LATE' || status === 'MISSED'
        ? 'destructive'
        : 'outline';
  return <Badge variant={variant}>{labels[status]}</Badge>;
}
