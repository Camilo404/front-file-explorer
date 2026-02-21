import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthStoreService } from '../auth/auth-store.service';

/**
 * Blocks access to protected routes when the user must change their password.
 * Redirects to /auth/force-change-password instead.
 */
export const noForcePasswordChangeGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (authStore.forcePasswordChange()) {
    return router.createUrlTree(['/auth/force-change-password']);
  }

  return true;
};

/**
 * Ensures only users with the force_password_change flag can access
 * the force-change-password page. Others are redirected to /explorer.
 */
export const requireForcePasswordChangeGuard: CanActivateFn = () => {
  const authStore = inject(AuthStoreService);
  const router = inject(Router);

  if (!authStore.isAuthenticated) {
    return router.createUrlTree(['/auth/login']);
  }

  if (authStore.forcePasswordChange()) {
    return true;
  }

  return router.createUrlTree(['/explorer']);
};
