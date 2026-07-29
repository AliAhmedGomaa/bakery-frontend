import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { permissionGuard } from './core/guards/role.guard';
import { Permission } from './core/models/types';

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
        canActivate: [permissionGuard(Permission.DASHBOARD)],
      },
      {
        path: 'pos',
        loadComponent: () =>
          import('./features/pos/pos.component').then((m) => m.PosComponent),
        canActivate: [permissionGuard(Permission.POS)],
      },
      {
        path: 'products',
        loadComponent: () =>
          import('./features/products/products.component').then((m) => m.ProductsComponent),
        canActivate: [permissionGuard(Permission.PRODUCTS)],
      },
      {
        path: 'categories',
        loadComponent: () =>
          import('./features/categories/categories.component').then((m) => m.CategoriesComponent),
        canActivate: [permissionGuard(Permission.CATEGORIES)],
      },
      {
        path: 'production',
        loadComponent: () =>
          import('./features/production/production.component').then((m) => m.ProductionComponent),
        canActivate: [permissionGuard(Permission.PRODUCTION)],
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
        canActivate: [permissionGuard(Permission.INVENTORY)],
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./features/users/users.component').then((m) => m.UsersComponent),
        canActivate: [permissionGuard(Permission.USERS)],
      },
      {
        path: 'roles',
        loadComponent: () =>
          import('./features/roles/roles.component').then((m) => m.RolesComponent),
        canActivate: [permissionGuard(Permission.ROLES)],
      },
      {
        path: 'branding',
        loadComponent: () =>
          import('./features/settings/branding-settings.component').then(
            (m) => m.BrandingSettingsComponent,
          ),
        canActivate: [permissionGuard(Permission.BRANDING)],
      },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
