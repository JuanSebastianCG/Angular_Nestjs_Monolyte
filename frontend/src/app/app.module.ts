import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS, HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { HomeComponent } from './home/home.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuthInterceptor } from './interceptors/auth.interceptor';
import { NotificationComponent } from './components/notification/notification.component';
import { FormFieldComponent } from './components/shared/form-field/form-field.component';

// Import components from correct paths
import { CursosComponent } from './cursos/cursos.component';
import { CourseCardComponent } from './components/course-card/course-card.component';
import { DepartamentosComponent } from './departamentos/departamentos.component';
import { InscribirComponent } from './inscribir/inscribir.component';
import { NotasComponent } from './notas/notas.component';

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    LoginComponent,
    RegisterComponent,
    NotificationComponent,
    FormFieldComponent,
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    HttpClientModule,
    ReactiveFormsModule,
    // Import standalone components here
    CursosComponent,
    CourseCardComponent,
    DepartamentosComponent,
    InscribirComponent,
    NotasComponent,
  ],
  providers: [
    { provide: HTTP_INTERCEPTORS, useClass: AuthInterceptor, multi: true },
  ],
  bootstrap: [AppComponent],
})
export class AppModule {}
