import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';
import { CoursesComponent } from './pages/courses/courses.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginPageComponent },
  { path: 'register', component: RegisterPageComponent },
  {
    path: 'courses',
    component: CoursesComponent,
    canActivate: [authGuard],
    data: { roles: ['admin', 'professor', 'student'] },
  },
  {
    path: 'enrollment',
    loadComponent: () =>
      import('./pages/student/enrollment/enrollment.component').then(
        (m) => m.EnrollmentComponent,
      ),
    canActivate: [authGuard, RoleGuard],
    data: { expectedRole: 'student' },
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
