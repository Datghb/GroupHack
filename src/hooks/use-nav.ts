'use client';
import { useMemo } from 'react';
import type { NavItem, NavGroup } from '@/types';
import { useCurrentUser } from '@/hooks/use-current-user';

export function useFilteredNavItems(items: NavItem[]) {
  const { user } = useCurrentUser();
  return useMemo(() => {
    const allowed = (item: NavItem) => !item.access?.role || item.access.role === user?.role;
    return items.filter(allowed).map((item) => ({
      ...item,
      items: item.items?.filter(allowed)
    }));
  }, [items, user?.role]);
}

export function useFilteredNavGroups(groups: NavGroup[]) {
  const items = useFilteredNavItems(
    useMemo(() => groups.flatMap((group) => group.items), [groups])
  );
  return useMemo(
    () =>
      groups
        .map((group) => ({
          ...group,
          items: items.filter((item) => group.items.some((entry) => entry.title === item.title))
        }))
        .filter((group) => group.items.length > 0),
    [groups, items]
  );
}
