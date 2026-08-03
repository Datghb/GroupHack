'use client';
import { useCurrentUser } from '@/hooks/use-current-user';
export default function ProfileViewPage() {
  const { user } = useCurrentUser();
  return (
    <div className='w-full rounded-xl border bg-card p-6'>
      <h2 className='text-xl font-semibold'>{user?.fullName || 'Đang tải...'}</h2>
      <p className='mt-2 text-muted-foreground'>{user?.email}</p>
      <p className='mt-2 text-sm'>Vai trò: {user?.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}</p>
    </div>
  );
}
