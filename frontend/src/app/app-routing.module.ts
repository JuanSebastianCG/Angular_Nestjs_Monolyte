import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { CursosComponent } from './pages/course/cursos.component';
import { DepartamentosComponent } from './pages/departments/departments.component';
import { InscribirComponent } from './pages/enrollment/enrollment.component';

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
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
