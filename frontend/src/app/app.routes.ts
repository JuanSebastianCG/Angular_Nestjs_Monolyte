import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';
import { RoleGuard } from './guards/role.guard';
import { CourseListComponent } from './pages/courses/course-list/course-list.component';
import { ViewCourseComponent } from './pages/view-course/view-course.component';
import { authGuard, professorOrAdminGuard } from './guards/auth.guard';
import { DepartmentsComponent } from './pages/departments/departments.component';

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
    canActivate: [authGuard, RoleGuard],
    data: { expectedRole: 'student' },
  },

  // Enrollment route
  {
    path: 'enrollment',
    loadComponent: () =>
      import('./pages/student/enrollment/enrollment.component').then(
        (m) => m.EnrollmentComponent,
      ),
    canActivate: [authGuard, RoleGuard],
    data: { expectedRole: 'student' },
  },

  // Professor-specific routes
  {
    path: 'professor',
    children: [
      { path: 'courses', component: CourseListComponent },
      { path: 'evaluations', component: HomeComponent },
    ],
    canActivate: [authGuard, RoleGuard],
    data: { expectedRole: 'professor' },
  },

  // Admin-specific routes
  {
    path: 'admin',
    children: [
      { path: 'dashboard', component: HomeComponent },
      {
        path: 'users',
        loadComponent: () =>
          import('./pages/admin/users/admin-users.component').then(
            (m) => m.AdminUsersComponent,
          ),
      },
    ],
    canActivate: [authGuard, RoleGuard],
    data: { expectedRole: 'admin' },
  },

  // Course routes
  { path: 'courses', component: CourseListComponent, canActivate: [authGuard] },
  {
    path: 'courses/:id',
    component: ViewCourseComponent,
    canActivate: [authGuard],
  },
  { 
    path: 'departments', 
    component: DepartmentsComponent,
    canActivate: [authGuard]
  },

  // Profile route
  {
    path: 'profile',
    loadComponent: () =>
      import('./pages/profile/profile.component').then(
        (m) => m.ProfileComponent,
      ),
    canActivate: [authGuard],
  },

  // Fallback route
  { path: '**', redirectTo: '/home' },
];
