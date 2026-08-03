import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import { CurrentUserProvider } from '@/hooks/use-current-user';
import { getCurrentUser } from '@/lib/classroom-auth';

export const metadata: Metadata = {
  title: 'VICheck',
  description: 'Không gian quản lý lớp học, nhóm và checkpoint.',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Persisting the sidebar state in the cookie.
  const [cookieStore, user] = await Promise.all([cookies(), getCurrentUser()]);
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <CurrentUserProvider initialUser={user}>
      <KBar>
        <SidebarProvider defaultOpen={defaultOpen}>
          <AppSidebar />
          <SidebarInset>
            <Header />
            <InfobarProvider defaultOpen={false}>
              {children}
              <InfoSidebar side='right' />
            </InfobarProvider>
          </SidebarInset>
        </SidebarProvider>
      </KBar>
    </CurrentUserProvider>
  );
}
