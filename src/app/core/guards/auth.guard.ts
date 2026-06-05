import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

/** Redirects to /login if the user is not authenticated. */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isLoggedIn ? true : router.createUrlTree(['/login']);
};

/** Redirects to /dashboard if the user is not an admin. */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin ? true : router.createUrlTree(['/dashboard']);
};
