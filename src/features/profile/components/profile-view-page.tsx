'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { useCurrentUser } from '@/hooks/use-current-user';

export default function ProfileViewPage() {
  const { user } = useCurrentUser();
  const [fullName, setFullName] = useState('');
  const [pending, setPending] = useState(false);
  useEffect(() => setFullName(user?.fullName ?? ''), [user?.fullName]);
  if (!user) return <Skeleton className='h-56 w-full' />;

  async function saveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    const response = await fetch('/api/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName })
    });
    const body = (await response.json()) as { error?: string };
    setPending(false);
    if (!response.ok) return toast.error(body.error ?? 'Không thể cập nhật hồ sơ.');
    toast.success('Đã cập nhật hồ sơ.');
  }

  return (
    <Card className='max-w-2xl'>
      <CardHeader>
        <div className='flex items-center gap-4'>
          <Avatar size='lg'>
            <AvatarImage src={user.imageUrl ?? ''} alt={user.fullName} />
            <AvatarFallback>{user.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <CardTitle>Hồ sơ cá nhân</CardTitle>
            <CardDescription>Cập nhật tên hiển thị của bạn.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form className='space-y-4' onSubmit={saveProfile}>
          <div className='space-y-2'>
            <Label htmlFor='profile-name'>Họ và tên</Label>
            <Input
              id='profile-name'
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              minLength={2}
              maxLength={100}
              required
            />
          </div>
          <div className='space-y-2'>
            <Label htmlFor='profile-email'>Email</Label>
            <Input id='profile-email' value={user.email} disabled />
          </div>
          <p className='text-sm text-muted-foreground'>
            Vai trò: {user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh'}
          </p>
          <Button type='submit' disabled={pending}>
            {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
