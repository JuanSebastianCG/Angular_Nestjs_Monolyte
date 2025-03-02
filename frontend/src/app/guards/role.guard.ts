import { Injectable } from '@angular/core';
import {
  Router,
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { NotificationService } from '../components/notification/notification.service';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): boolean {
    // Get the roles required for this route
    const requiredRoles = route.data['roles'] as Array<string>;

    // If no roles are required, allow access
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Get the current user
    const currentUser = this.authService.currentUserValue;

    // If no user or no user role, deny access
    if (!currentUser || !currentUser.role) {
      this.notificationService.error(
        'Acceso denegado. Por favor inicie sesión.',
      );
      this.router.navigate(['/login']);
      return false;
    }

    // Check if the user's role is allowed
    const hasRole = requiredRoles.includes(currentUser.role.toLowerCase());

    if (!hasRole) {
      this.notificationService.error(
        'No tienes permisos para acceder a esta página.',
      );

      // Redirect to an appropriate page based on role
      switch (currentUser.role.toLowerCase()) {
        case 'student':
          this.router.navigate(['/cursos']);
          break;
        case 'professor':
          this.router.navigate(['/cursos']);
          break;
        case 'admin':
          this.router.navigate(['/departamentos']);
          break;
        default:
          this.router.navigate(['/home']);
      }
    }

    return hasRole;
  }
}
