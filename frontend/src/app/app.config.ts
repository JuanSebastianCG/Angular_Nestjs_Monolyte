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
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { CursosComponent } from './cursos/cursos.component';
import { DepartamentosComponent } from './departamentos/departamentos.component';
import { InscribirComponent } from './inscribir/inscribir.component';
import { NotasComponent } from './notas/notas.component';
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
    loadComponent: () => import('./components/course-detail/course-detail.component').then(m => m.CourseDetailComponent),
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
  {
    path: 'notas',
    component: NotasComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['student', 'professor'] },
  },
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
