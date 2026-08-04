'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
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
    try {
      const response = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName })
      });
      const body = (await response.json()) as { error?: string };
      if (!response.ok) return toast.error(body.error ?? 'Không thể cập nhật hồ sơ.');
      toast.success('Đã cập nhật hồ sơ.');
    } catch {
      toast.error('Không thể kết nối đến máy chủ. Vui lòng thử lại.');
    } finally {
      setPending(false);
    }
  }

  const roleLabel = user.role === 'TEACHER' ? 'Giáo viên' : 'Học sinh';

  return (
    <Card className='w-full max-w-4xl overflow-hidden'>
      <CardHeader className='border-b bg-muted/30 px-6 py-6 sm:px-8'>
        <div className='flex flex-col gap-4 sm:flex-row sm:items-center'>
          <Avatar className='size-20 border-4 border-background shadow-sm'>
            <AvatarImage src={user.imageUrl ?? ''} alt={user.fullName} />
            <AvatarFallback>{user.fullName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className='min-w-0 space-y-1'>
            <div className='flex flex-wrap items-center gap-2'>
              <CardTitle className='truncate text-xl'>{user.fullName}</CardTitle>
              <Badge variant='secondary'>{roleLabel}</Badge>
            </div>
            <CardDescription className='break-all sm:break-normal'>{user.email}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className='px-6 py-6 sm:px-8'>
        <form className='space-y-6' onSubmit={saveProfile}>
          <div className='space-y-1'>
            <CardTitle className='text-lg'>Thông tin tài khoản</CardTitle>
            <CardDescription>Cập nhật tên hiển thị được dùng trong lớp học.</CardDescription>
          </div>
          <div className='grid gap-5 md:grid-cols-2'>
            <div className='space-y-2'>
              <Label htmlFor='profile-name'>Họ và tên</Label>
              <Input
                id='profile-name'
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                minLength={2}
                maxLength={100}
                autoComplete='name'
                required
              />
            </div>
            <div className='space-y-2'>
              <Label htmlFor='profile-email'>Email</Label>
              <Input id='profile-email' value={user.email} disabled />
              <p className='text-xs text-muted-foreground'>Email đăng nhập không thể thay đổi.</p>
            </div>
          </div>
          <div className='flex justify-end border-t pt-5'>
            <Button type='submit' disabled={pending}>
              {pending ? 'Đang lưu...' : 'Lưu thay đổi'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
