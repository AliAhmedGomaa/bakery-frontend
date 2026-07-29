import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Role } from '../models/types';

function homeForRole(role: Role | null): string {
  switch (role) {
    case Role.CASHIER:
      return '/pos';
    case Role.HEAD_BAKER:
      return '/production';
    case Role.STOREKEEPER:
      return '/inventory';
    case Role.ACCOUNTANT:
    case Role.MANAGER:
    case Role.ADMIN:
    default:
      return '/dashboard';
  }
}

export function roleGuard(...roles: Role[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const router = inject(Router);

    if (auth.hasRole(...roles)) return true;

    router.navigateByUrl(homeForRole(auth.userRole()));
    return false;
  };
}
