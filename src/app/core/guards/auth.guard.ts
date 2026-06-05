import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/** Waits for session restore to complete, then redirects to /login if not authenticated. */
export const authGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);

  return auth.sessionReady$.pipe(
    filter(ready => ready),
    take(1),
    map(() => auth.isLoggedIn ? true : router.createUrlTree(['/login'])),
  );
};

/** Redirects to /dashboard if the user is not an admin. */
export const adminGuard: CanActivateFn = () => {
  const auth   = inject(AuthService);
  const router = inject(Router);
  return auth.isAdmin ? true : router.createUrlTree(['/dashboard']);
};
