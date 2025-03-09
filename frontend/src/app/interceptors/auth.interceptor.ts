import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
  HttpInterceptorFn,
  HttpHandlerFn,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';
import { Router } from '@angular/router';

/**
 * Auth interceptor function for handling authentication tokens
 * Used with provideHttpClient(withInterceptors([authInterceptor]))
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Skip interceptor for login endpoint
  if (shouldSkipInterceptor(req)) {
    return next(req);
  }

  // Add auth token to request
  const token = authService.getAccessToken();
  if (token) {
    req = addToken(req, token);
  }

  // Handle the request and catch any errors
  return next(req).pipe(
    catchError((error) => {
      if (error instanceof HttpErrorResponse && error.status === 401) {
        // For 401 errors, log out the user and redirect to login page
        console.error('Authentication error occurred:', error);
        authService.logout().subscribe(() => {
          router.navigate(['/login']);
        });
      }
      return throwError(() => error);
    }),
  );
};

/**
 * Add authorization token to request
 */
function addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
  return request.clone({
    setHeaders: {
      Authorization: `Bearer ${token}`,
    },
  });
}

/**
 * Determines if the interceptor should be skipped for certain requests
 */
function shouldSkipInterceptor(request: HttpRequest<any>): boolean {
  // Skip adding token only for login request
  const skipUrls = ['auth/login'];

  // Check if the URL exactly matches any of the skip URLs
  return skipUrls.some((url) => {
    const urlPattern = new RegExp(`${url}(/)?$`);
    return urlPattern.test(request.url);
  });
}
