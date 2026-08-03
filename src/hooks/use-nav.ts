'use client';
import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';
import { useCurrentUser } from '@/hooks/use-current-user';

function filterItems(items: NavItem[], role?: string): NavItem[] {
  if (!role) return [];
  return items
    .filter((item) => !item.access?.role || item.access.role === role)
    .map((item) => ({
      ...item,
      items: item.items?.filter((child) => !child.access?.role || child.access.role === role)
    }));
}

export function useFilteredNavItems(items: NavItem[]) {
  const { user } = useCurrentUser();
  return useMemo(() => filterItems(items, user?.role), [items, user?.role]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const { user } = useCurrentUser();
  return useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: filterItems(group.items, user?.role)
        }))
        .filter((group) => group.items.length > 0),
    [groups, user?.role]
  );
}
