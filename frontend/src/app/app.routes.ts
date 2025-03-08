import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },

  // Student-specific routes
  {
    path: 'student',
    children: [
      { path: 'dashboard', component: HomeComponent },
      { path: 'enrollments', component: HomeComponent },
      { path: 'grades', component: HomeComponent },
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'student' },
  },

  // Professor-specific routes
  {
    path: 'professor',
    children: [
      { path: 'courses', component: HomeComponent },
      { path: 'evaluations', component: HomeComponent },
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'professor' },
  },

  // Admin-specific routes
  {
    path: 'admin',
    children: [
      { path: 'dashboard', component: HomeComponent },
      { path: 'users', component: HomeComponent },
    ],
    canActivate: [AuthGuard, RoleGuard],
    data: { expectedRole: 'admin' },
  },

  // Course routes
  { path: 'courses', component: HomeComponent }, // Placeholder
  { path: 'departments', component: HomeComponent }, // Placeholder

  // Profile route
  { path: 'profile', component: HomeComponent, canActivate: [AuthGuard] }, // Placeholder

  // Fallback route
  { path: '**', redirectTo: '/home' },
];
