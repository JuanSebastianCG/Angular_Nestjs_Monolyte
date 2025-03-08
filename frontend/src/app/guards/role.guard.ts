import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../components/notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    const currentUser = this.authService.currentUserValue;

    // First check if the user is authenticated
    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    // Check if route has any role requirements
    if (next.data && next.data['roles']) {
      const requiredRoles = next.data['roles'] as Array<string>;

      // Check if user's role is in the list of required roles
      if (requiredRoles.includes(currentUser.role)) {
        return true;
      } else {
        // User doesn't have the required role
        this.notificationService.error(
          `Access denied. You need ${requiredRoles.join(' or ')} role to access this page.`,
        );

        // Redirect based on user's role
        switch (currentUser.role) {
          case 'admin':
            this.router.navigate(['/admin/dashboard']);
            break;
          case 'professor':
            this.router.navigate(['/professor/courses']);
            break;
          case 'student':
            this.router.navigate(['/student/courses']);
            break;
          default:
            this.router.navigate(['/home']);
        }

        return false;
      }
    }

    // If no roles are required, allow access
    return true;
  }
}
