import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStoreService } from '../auth/auth-store.service';
import { UserRole } from '../models/api.models';

export function roleGuard(roles: UserRole[]): CanActivateFn {
  return () => {
    const authStore = inject(AuthStoreService);
    const router = inject(Router);

    if (authStore.isAuthenticated && authStore.hasRole(roles)) {
      return true;
    }

    return router.createUrlTree(['/explorer']);
  };
}
