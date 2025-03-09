import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Authentication guard for routes that require a logged-in user
 */
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    // User is authenticated, allow access
    return true;
  }

  // User is not authenticated, redirect to login
  router.navigate(['/login'], {
    queryParams: { returnUrl: state.url },
  });

  return false;
};

/**
 * Guard that checks if the user has professor or admin role
 */
export const professorOrAdminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (
    authService.isAuthenticated() &&
    (authService.isProfessor() || authService.isAdmin())
  ) {
    // User is authenticated and is a professor or admin
    return true;
  }

  if (!authService.isAuthenticated()) {
    // User is not authenticated, redirect to login
    router.navigate(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  } else {
    // User is authenticated but doesn't have the right role
    router.navigate(['/unauthorized']);
  }

  return false;
};
