import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
	{
		path: 'auth/login',
		loadComponent: () => import('./features/auth/login.page').then((m) => m.LoginPage),
	},
	{
		path: '',
		canActivate: [authGuard],
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
		],
	},
	{
		path: '**',
		redirectTo: 'explorer',
	},
];
