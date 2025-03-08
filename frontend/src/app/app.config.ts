import {
  ApplicationConfig,
  provideZoneChangeDetection,
  inject,
  importProvidersFrom,
  APP_INITIALIZER,
} from '@angular/core';
import {
  provideRouter,
  withComponentInputBinding,
  Routes,
  withViewTransitions,
} from '@angular/router';
import {
  provideHttpClient,
  withInterceptors,
  HttpHandlerFn,
  HttpRequest,
  HttpClientModule,
} from '@angular/common/http';
import { provideAnimations } from '@angular/platform-browser/animations';
import { AuthService } from './services/auth.service';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { provideClientHydration } from '@angular/platform-browser';
import { ReactiveFormsModule } from '@angular/forms';
import { routes } from './app.routes';

// Import components for the routes
import { HomeComponent } from './pages/home/home.component';
import { LoginPageComponent } from './pages/auth/login/login.component';
import { RegisterPageComponent } from './pages/auth/register/register.component';

import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';

// Function to initialize the app - restore user session
export function initializeApp(authService: AuthService) {
  return () => {
    // Any app initialization logic can go here
    console.log('App initialized');
  };
}

// Create a custom interceptor function
function authInterceptor(req: any, next: any) {
  const authService = inject(AuthService);

  // Get the auth token from the service
  const token = authService.getAccessToken();

  // Clone the request and replace the original headers with
  // cloned headers, updated with the authorization
  if (token) {
    const authReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`),
    });
    // Send cloned request with header to the next handler
    return next(authReq);
  }
  return next(req);
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({
      eventCoalescing: true,
      runCoalescing: true,
    }),
    // Re-enable router provider with our routes
    provideRouter(routes, withViewTransitions()),
    provideClientHydration(),
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    importProvidersFrom(HttpClientModule, ReactiveFormsModule),
    AuthService,
    {
      provide: APP_INITIALIZER,
      useFactory: initializeApp,
      deps: [AuthService],
      multi: true,
    },
    // Add other services here
  ],
};
