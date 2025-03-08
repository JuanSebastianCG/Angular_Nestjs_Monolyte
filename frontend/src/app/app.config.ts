import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  Routes,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Import components for the routes
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { CursosComponent } from './pages/course/cursos.component';
import { DepartamentosComponent } from './pages/departments/departments.component';
import { InscribirComponent } from './pages/enrollment/enrollment.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Define the routes for standalone components
const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  {
    path: 'cursos',
    component: CursosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'cursos/:id',
    loadComponent: () =>
      import('./pages/course-detail/course-detail.component').then(
        (m) => m.CourseDetailComponent,
      ),
    canActivate: [AuthGuard],
  },
  {
    path: 'departamentos',
    component: DepartamentosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  {
    path: 'inscribir',
    component: InscribirComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student'] },
  },
  // Student-specific routes
  {
    path: 'student',
    children: [
      { path: 'courses', component: CursosComponent },
      { path: 'profile', component: HomeComponent }, // Placeholder until profile component is created
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student'] },
  },
  // Professor-specific routes
  {
    path: 'professor',
    children: [
      { path: 'courses', component: CursosComponent },
      { path: 'profile', component: HomeComponent }, // Placeholder until profile component is created
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['professor'] },
  },
  // Admin-specific routes
  {
    path: 'admin',
    children: [
      { path: 'dashboard', component: HomeComponent }, // Placeholder until dashboard component is created
      { path: 'departments', component: DepartamentosComponent },
      { path: 'users', component: HomeComponent }, // Placeholder until users component is created
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },
  // Fallback route
  { path: '**', redirectTo: '/home' },
];

// Create a custom interceptor function
function authInterceptorFn(req: HttpRequest<unknown>, next: HttpHandlerFn) {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();

  if (token) {
    // Clone the request and add the authorization header
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(req).pipe(
    catchError((error) => {
      // Handle 401 Unauthorized or 403 Forbidden responses
      if (error.status === 401 || error.status === 403) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    }),
  );
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),
    // Re-enable router provider with our routes
    provideRouter(routes, withComponentInputBinding()),
    provideHttpClient(withInterceptors([authInterceptorFn])),
    provideAnimations(),
    AuthService,
    // Add other services here
  ],
};
