import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { CursosComponent } from './cursos/cursos.component';
import { DepartamentosComponent } from './departamentos/departamentos.component';
import { InscribirComponent } from './inscribir/inscribir.component';
import { NotasComponent } from './notas/notas.component';
import { CourseDetailComponent } from './components/course-detail/course-detail.component';

const routes: Routes = [
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Cursos route - accessible to all authenticated users
  {
    path: 'cursos',
    component: CursosComponent,
    canActivate: [AuthGuard],
  },
  {
    path: 'cursos/:id',
    component: CourseDetailComponent,
    canActivate: [AuthGuard],
  },

  // Admin-specific routes
  {
    path: 'departamentos',
    component: DepartamentosComponent,
    canActivate: [AuthGuard, RoleGuard],
    data: { roles: ['admin'] },
  },

  // Student-specific routes
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
    data: { roles: ['student'] },
  },

  // Fallback route
  { path: '**', redirectTo: '/home' },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}
