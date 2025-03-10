import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';

// Pages / Routing Components
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';
import { CoursesComponent } from './pages/courses/courses.component';
// The EnrollmentComponent is now standalone and will be loaded through the router
// import { EnrollmentComponent } from './pages/student/enrollment/enrollment.component';

// Shared Components
import { NavbarComponent } from './components/navbar/navbar.component';
import { AlertComponent } from './components/alert/alert.component';
import { FormFieldComponent } from './components/form-field/form-field.component';
import { FormCardComponent } from './components/form-card/form-card.component';
import { FormContainerComponent } from './components/form-container/form-container.component';
import { AppButtonComponent } from './components/app-button/app-button.component';
import { ModalComponent } from './components/modal/modal.component';

// Interceptors
import { authInterceptor } from './interceptors/auth.interceptor';

// Services
import { AuthService } from './services/auth.service';
import { CourseService } from './services/course.service';
import { DepartmentService } from './services/department.service';
import { EnrollmentService } from './services/enrollment.service';

@NgModule({
  declarations: [
    // No components here - they're all standalone
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    ReactiveFormsModule,
    // HttpClientModule removed - now using provideHttpClient in main.ts
    // Add standalone components here
    AppComponent,
    HomeComponent,
    LoginPageComponent,
    RegisterPageComponent,
    CoursesComponent,
    // EnrollmentComponent is now standalone and will be loaded through the router
    NavbarComponent,
    AlertComponent,
    FormFieldComponent,
    FormCardComponent,
    FormContainerComponent,
    AppButtonComponent,
    ModalComponent,
  ],
  providers: [
    // HTTP interceptors are now provided in main.ts with provideHttpClient(withInterceptors([...]))
    AuthService,
    CourseService,
    DepartmentService,
    EnrollmentService,
  ],
})
export class AppModule {}
