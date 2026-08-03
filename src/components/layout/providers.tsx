'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import QueryProvider from './query-provider';
import { CurrentUserProvider } from '@/hooks/use-current-user';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <QueryProvider>
          <CurrentUserProvider>{children}</CurrentUserProvider>
        </QueryProvider>
      </ActiveThemeProvider>
    </>
  );
}
