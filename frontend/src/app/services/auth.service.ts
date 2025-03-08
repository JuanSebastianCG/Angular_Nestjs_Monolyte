import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

export interface User {
  id: string;
  name: string;
  username: string;
  role: string;
  token?: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    // Retrieve user info from localStorage on service initialization
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  public isLoggedIn(): boolean {
    return !!this.currentUserValue;
  }

  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, credentials).pipe(
      tap((response) => {
        // Store user details and token in localStorage
        const user: User = {
          id: response.user.id,
          name: response.user.name,
          username: response.user.username,
          role: response.user.role,
          token: response.access_token,
        };
        localStorage.setItem('currentUser', JSON.stringify(user));
        localStorage.setItem('refreshToken', response.refresh_token);
        this.currentUserSubject.next(user);
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(
          () =>
            new Error('Authentication failed. Please check your credentials.'),
        );
      }),
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, userData).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(
          () => new Error('Registration failed. Please try again.'),
        );
      }),
    );
  }

  logout(): void {
    // Remove user from localStorage
    localStorage.removeItem('currentUser');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);

    // Navigate to login page
    this.navigateByRole('guest');
  }

  private navigateByRole(role: string): void {
    if (role === 'guest') {
      this.router.navigate(['/login']);
      return;
    }

    switch (role.toLowerCase()) {
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      case 'professor':
        this.router.navigate(['/professor/courses']);
        break;
      case 'student':
        this.router.navigate(['/student/courses']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }

  getToken(): string {
    const user = this.currentUserValue;
    return user ? user.token || '' : '';
  }
}
