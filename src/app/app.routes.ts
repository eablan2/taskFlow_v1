import { Routes } from '@angular/router';
import { authGuard, adminGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./features/shared/shell.component').then(m => m.ShellComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
      },
      {
        path: 'backlog',
        loadComponent: () =>
          import('./features/backlog/backlog.component').then(m => m.BacklogComponent),
      },
      {
        path: 'board',
        loadComponent: () =>
          import('./features/board/board.component').then(m => m.BoardComponent),
      },
      {
        path: 'items',
        loadComponent: () =>
          import('./features/item-list/item-list-page.component').then(m => m.ItemListPageComponent),
      },
      {
        path: 'items/:id',
        loadComponent: () =>
          import('./features/item-detail/item-detail-page.component').then(m => m.ItemDetailPageComponent),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./features/admin/admin.component').then(m => m.AdminComponent),
      },
    ],
  },
  { path: '**', redirectTo: '/dashboard' },
];
