import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { ApiService } from './api.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private tokenKey = 'auth_token';
  private userKey = 'user_data';
  private currentUserSubject = new BehaviorSubject<any>(null);

  constructor(
    private apiService: ApiService,
    private router: Router,
  ) {
    this.loadStoredUser();
  }

  // Load user from localStorage on service initialization
  private loadStoredUser() {
    const token = localStorage.getItem(this.tokenKey);
    const userData = localStorage.getItem(this.userKey);

    if (token && userData) {
      this.currentUserSubject.next(JSON.parse(userData));
    }
  }

  // Get current user as observable
  get currentUser$(): Observable<any> {
    return this.currentUserSubject.asObservable();
  }

  // Get current user value
  get currentUserValue(): any {
    return this.currentUserSubject.value;
  }

  // Login user
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.apiService.post<any>('auth/login', credentials).pipe(
      tap((response) => {
        if (response && response.access_token) {
          localStorage.setItem(this.tokenKey, response.access_token);
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      }),
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  // Register user
  register(user: any): Observable<any> {
    return this.apiService.post<any>('users', user).pipe(
      catchError((error) => {
        return throwError(() => error);
      }),
    );
  }

  // Logout user
  logout(): void {
    // You could also call the logout endpoint if the API has one
    // this.apiService.post('auth/logout', {}).subscribe();

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Check if user is logged in
  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenKey);
  }

  // Get auth token
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }
}
