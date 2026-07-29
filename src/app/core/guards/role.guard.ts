import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Permission } from '../models/types';

function homeForPermissions(permissions: Permission[], role: string | null): string {
  if (role === 'ADMIN' || permissions.includes(Permission.DASHBOARD)) return '/dashboard';
  if (permissions.includes(Permission.POS)) return '/pos';
  if (permissions.includes(Permission.PRODUCTION)) return '/production';
  if (permissions.includes(Permission.INVENTORY)) return '/inventory';
  if (permissions.includes(Permission.PRODUCTS)) return '/products';
  return '/dashboard';
}

export function permissionGuard(...required: Permission[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasPermission(...required)) return true;

    router.navigateByUrl(homeForPermissions(auth.permissions(), auth.userRole()));
    return false;
  };
}

/** @deprecated use permissionGuard */
export function roleGuard(...roles: string[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(...roles)) return true;

    router.navigateByUrl(homeForPermissions(auth.permissions(), auth.userRole()));
    return false;
  };
}
