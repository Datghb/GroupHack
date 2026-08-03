import { NavGroup } from '@/types';

/**
 * Navigation configuration with RBAC support
 *
 * This configuration is used for both the sidebar navigation and Cmd+K bar.
 * Items are organized into groups, each rendered with a SidebarGroupLabel.
 *
 * RBAC Access Control:
 * Each navigation item can have an `access` property that controls visibility
 * based on permissions, plans, features, roles, and organization context.
 *
 * Examples:
 *
 * 1. Require organization:
 *    access: { requireOrg: true }
 *
 * 2. Require specific permission:
 *    access: { requireOrg: true, permission: 'org:teams:manage' }
 *
 * 3. Require specific plan:
 *    access: { plan: 'pro' }
 *
 * 4. Require specific feature:
 *    access: { feature: 'premium_access' }
 *
 * 5. Require specific role:
 *    access: { role: 'admin' }
 *
 * 6. Multiple conditions (all must be true):
 *    access: { requireOrg: true, permission: 'org:teams:manage', plan: 'pro' }
 *
 * Note: The `visible` function is deprecated but still supported for backward compatibility.
 * Use the `access` property for new items.
 */
export const navGroups: NavGroup[] = [
  {
    label: 'Giảng viên',
    items: [
      {
        title: 'Tổng quan',
        url: '/teacher/dashboard',
        icon: 'dashboard',
        items: [],
        access: { role: 'TEACHER' }
      },
      {
        title: 'Lớp học',
        url: '/teacher/classes',
        icon: 'workspace',
        items: [],
        access: { role: 'TEACHER' }
      },
      {
        title: 'Theo dõi tiến độ',
        url: '/teacher/classes/web-2026/assignments/assignment-1/monitor',
        icon: 'trendingUp',
        items: [],
        access: { role: 'TEACHER' }
      },
      {
        title: 'Hoạt động',
        url: '/teacher/dashboard#activity',
        icon: 'clock',
        items: [],
        access: { role: 'TEACHER' }
      }
    ]
  },
  {
    label: 'Sinh viên',
    items: [
      {
        title: 'Tổng quan',
        url: '/student/dashboard',
        icon: 'dashboard',
        items: [],
        access: { role: 'STUDENT' }
      },
      {
        title: 'Khám phá lớp học',
        url: '/student/classes',
        icon: 'search',
        items: [],
        access: { role: 'STUDENT' }
      },
      {
        title: 'Nhóm của tôi',
        url: '/student/classes/web-2026/teams/alpha',
        icon: 'teams',
        items: [],
        access: { role: 'STUDENT' }
      },
      {
        title: 'Checkpoint',
        url: '/student/classes/web-2026/assignments/assignment-1',
        icon: 'checks',
        items: [],
        access: { role: 'STUDENT' }
      }
    ]
  },
  {
    label: 'Tài khoản',
    items: [
      {
        title: 'Hồ sơ',
        url: '/dashboard/profile',
        icon: 'account',
        items: []
      }
    ]
  }
];
