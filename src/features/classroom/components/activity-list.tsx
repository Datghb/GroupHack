import { format } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { activities } from '../api/data';

export function ActivityList({ teamId }: { teamId?: string }) {
  const items = teamId ? activities.filter((activity) => activity.teamId === teamId) : activities;
  return (
    <ol className='flex flex-col gap-5'>
      {items.map((activity) => (
        <li key={activity.id} className='flex items-start gap-3'>
          <Avatar className='size-9'>
            <AvatarFallback>{activity.actor.slice(0, 1)}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 flex-1'>
            <p>
              <span className='font-medium'>{activity.actor}</span> {activity.message}
            </p>
            <time
              className='text-muted-foreground text-xs'
              dateTime={activity.createdAt.toISOString()}
            >
              {format(activity.createdAt, "HH:mm '·' dd MMM", { locale: vi })}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
