import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { Role } from './core/models/types';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () =>
      import('./features/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: '',
    loadComponent: () =>
      import('./layout/dashboard-layout.component').then((m) => m.DashboardLayoutComponent),
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/dashboard/dashboard.component').then((m) => m.DashboardComponent),
        canActivate: [roleGuard(Role.ADMIN, Role.MANAGER, Role.ACCOUNTANT)],
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
        canActivate: [roleGuard(Role.ADMIN, Role.MANAGER, Role.CASHIER)],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
        canActivate: [roleGuard(Role.ADMIN, Role.MANAGER)],
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./features/production/production.component').then((m) => m.ProductionComponent),
        canActivate: [roleGuard(Role.ADMIN, Role.MANAGER, Role.HEAD_BAKER)],
        children: [
          { path: '', redirectTo: 'recipes', pathMatch: 'full' },
          {
            path: 'recipes',
            loadComponent: () =>
              import('./features/production/recipe-builder/recipe-builder.component').then(
                (m) => m.RecipeBuilderComponent,
              ),
          },
          {
            path: 'batches',
            loadComponent: () =>
              import('./features/production/batch-logger/batch-logger.component').then(
                (m) => m.BatchLoggerComponent,
              ),
          },
        ],
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('./features/inventory/inventory.component').then((m) => m.InventoryComponent),
        canActivate: [roleGuard(Role.ADMIN, Role.MANAGER, Role.STOREKEEPER)],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        canActivate: [roleGuard(Role.ADMIN)],
      },
      {
        path: 'branding',
        loadComponent: () =>
          import('./features/settings/branding-settings.component').then(
            (m) => m.BrandingSettingsComponent,
          ),
        canActivate: [roleGuard(Role.ADMIN)],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
