'use client';
import { BrandLogo } from '@/components/brand-logo';
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
export function OrgSwitcher() {
  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton size='lg'>
          <BrandLogo alt='' priority />
          <div className='grid flex-1 text-left text-sm leading-tight'>
            <span className='truncate font-medium'>VICheck</span>
            <span className='truncate text-xs text-muted-foreground'>Tiến độ lớp học</span>
          </div>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
