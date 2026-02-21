import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { noForcePasswordChangeGuard, requireForcePasswordChangeGuard } from './core/guards/force-password-change.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{
		path: 'auth/login',
		loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
	},
	{
		path: 'auth/force-change-password',
		canActivate: [requireForcePasswordChangeGuard],
		loadComponent: () =>
			import('./features/auth/force-change-password.page').then((m) => m.ForceChangePasswordPage),
	},
	{
		path: '',
		canActivate: [authGuard, noForcePasswordChangeGuard],
		loadComponent: () => import('./features/layout/shell.component').then((m) => m.ShellComponent),
		children: [
			{
				path: '',
				pathMatch: 'full',
				redirectTo: 'explorer',
			},
			{
				path: 'explorer',
				loadComponent: () => import('./features/explorer/explorer.page').then((m) => m.ExplorerPage),
			},
			{
				path: 'jobs',
				canActivate: [roleGuard(['editor', 'admin'])],
				loadComponent: () => import('./features/jobs/jobs.page').then((m) => m.JobsPage),
			},
			{
				path: 'trash',
				canActivate: [roleGuard(['editor', 'admin'])],
				loadComponent: () => import('./features/trash/trash.page').then((m) => m.TrashPage),
			},
			{
				path: 'audit',
				canActivate: [roleGuard(['admin'])],
				loadComponent: () => import('./features/audit/audit.page').then((m) => m.AuditPage),
			},
			{
				path: 'users',
				canActivate: [roleGuard(['admin'])],
				loadComponent: () => import('./features/users/users.page').then((m) => m.UsersPage),
			},
			{
				path: 'shares',
				canActivate: [roleGuard(['editor', 'admin'])],
				loadComponent: () => import('./features/shares/shares.page').then((m) => m.SharesPage),
			},
			{
				path: 'storage',
				canActivate: [roleGuard(['admin'])],
				loadComponent: () => import('./features/storage/storage.page').then((m) => m.StoragePage),
			},
		],
	},
	{
		path: '**',
		redirectTo: 'explorer',
	},
];
