'use client';
import { Button } from '@/components/ui/button';
import { UserAvatarProfile } from '@/components/user-avatar-profile';
import { SignOutButton } from '@/components/auth/sign-out-button';
import { useCurrentUser } from '@/hooks/use-current-user';
export function UserNav() {
  const { user } = useCurrentUser();
  if (!user) return null;
  return (
    <SignOutButton>
      <Button variant='ghost' className='gap-2'>
        <UserAvatarProfile user={user} />
        Đăng xuất
      </Button>
    </SignOutButton>
  );
}
