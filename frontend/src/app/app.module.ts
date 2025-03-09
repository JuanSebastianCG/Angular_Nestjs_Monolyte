import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule, HTTP_INTERCEPTORS } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Pages / Routing Components
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';
import { CoursesComponent } from './pages/courses/courses.component';

// Shared Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertComponent } from './components/alert/alert.component';
import { FormFieldComponent } from './components/form-field/form-field.component';
import { FormCardComponent } from './components/form-card/form-card.component';
import { FormContainerComponent } from './components/form-container/form-container.component';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { ModalComponent } from './components/modal/modal.component';

// Interceptors
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { ErrorInterceptor } from './interceptors/error.interceptor';

// Services
import { AuthService } from './services/auth.service';
import { CourseService } from './services/course.service';
import { DepartmentService } from './services/department.service';
import { ProfessorService } from './services/professor.service';

@NgModule({
  declarations: [
    AppComponent,
    // Pages
    HomeComponent,
    LoginPageComponent,
    RegisterPageComponent,
    CoursesComponent,
    // Shared Components
    NavbarComponent,
    AlertComponent,
    FormFieldComponent,
    FormCardComponent,
    FormContainerComponent,
    AppButtonComponent,
    ModalComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
    { provide: HTTP_INTERCEPTORS, useClass: ErrorInterceptor, multi: true },
    AuthService,
    CourseService,
    DepartmentService,
    ProfessorService,
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
