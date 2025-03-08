import { Injectable } from '@angular/core';
import {
  CanActivate,
  ActivatedRouteSnapshot,
  RouterStateSnapshot,
  Router,
} from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Observable, map, take } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class RoleGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot,
  ): Observable<boolean> | Promise<boolean> | boolean {
    const expectedRole = route.data['expectedRole'];

    if (!expectedRole) {
      console.error('Role guard used without specifying an expected role');
      return false;
    }

    // First check if the user is authenticated
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: state.url },
      });
      return false;
    }

    // Check for specific roles
    switch (expectedRole) {
      case 'admin':
        return this.authService.isAdmin();
      case 'professor':
        return this.authService.isProfessor();
      case 'student':
        return this.authService.isStudent();
      default:
        return false;
    }
  }
}
