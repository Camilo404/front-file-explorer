import { Signal } from '@angular/core';

export interface NavigationItem {
  label: string;
  path: string;
  icon: string;
  activeBgClass: string;
  activeShadowClass: string;
  activeIconClass: string;
  roles?: string[]; // 'admin' | 'editor' | 'user' etc.
  description?: string; // For mobile menu
}

export const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Explorer',
    path: '/explorer',
    icon: 'fa-solid fa-folder-open',
    activeBgClass: 'bg-violet-600',
    activeShadowClass: 'shadow-violet-500/30',
    activeIconClass: 'text-violet-600',
    description: 'Browse your files'
  },
  {
    label: 'Jobs',
    path: '/jobs',
    icon: 'fa-solid fa-list-check',
    activeBgClass: 'bg-violet-600',
    activeShadowClass: 'shadow-violet-500/30',
    activeIconClass: 'text-violet-600',
    roles: ['admin', 'editor'],
    description: 'Async operations'
  },
  {
    label: 'Trash',
    path: '/trash',
    icon: 'fa-solid fa-trash',
    activeBgClass: 'bg-rose-600',
    activeShadowClass: 'shadow-rose-500/30',
    activeIconClass: 'text-rose-600',
    roles: ['admin', 'editor'],
    description: 'Deleted files'
  },
  {
    label: 'Shares',
    path: '/shares',
    icon: 'fa-solid fa-share-nodes',
    activeBgClass: 'bg-violet-600',
    activeShadowClass: 'shadow-violet-500/30',
    activeIconClass: 'text-violet-600',
    roles: ['admin', 'editor'],
    description: 'Public file links'
  },
  {
    label: 'Audit',
    path: '/audit',
    icon: 'fa-solid fa-clipboard-list',
    activeBgClass: 'bg-amber-600',
    activeShadowClass: 'shadow-amber-500/30',
    activeIconClass: 'text-amber-600',
    roles: ['admin'],
    description: 'Activity logs'
  },
  {
    label: 'Users',
    path: '/users',
    icon: 'fa-solid fa-users',
    activeBgClass: 'bg-violet-600',
    activeShadowClass: 'shadow-violet-500/30',
    activeIconClass: 'text-violet-600',
    roles: ['admin'],
    description: 'Manage accounts'
  },
  {
    label: 'Storage',
    path: '/storage',
    icon: 'fa-solid fa-hard-drive',
    activeBgClass: 'bg-violet-600',
    activeShadowClass: 'shadow-violet-500/30',
    activeIconClass: 'text-violet-600',
    roles: ['admin'],
    description: 'Disk statistics'
  }
];
