import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
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
    // Initialize current user from localStorage
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
      map((response) => {
        console.log('Login response:', response);
        // Store user details and jwt token in local storage to keep user logged in
        const user: User = {
          id: response.user.id,
          name: response.user.name,
          username: response.user.username,
          role: response.user.role,
          token: response.access_token,
        };

        localStorage.setItem('currentUser', JSON.stringify(user));
        this.currentUserSubject.next(user);

        // Navigate to the appropriate home page based on role
        this.navigateByRole(user.role);

        return user;
      }),
      catchError((error) => {
        console.error('Login error:', error);
        return throwError(() => error);
      }),
    );
  }

  register(userData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/users`, userData).pipe(
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => error);
      }),
    );
  }

  logout(): void {
    // Remove user from local storage and reset the subject
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  // Helper method to navigate based on user role
  private navigateByRole(role: string): void {
    const normalizedRole = role.toLowerCase();

    // All users go to cursos page, which will adapt to their role
    this.router.navigate(['/cursos']);
  }

  getToken(): string {
    const currentUser = this.currentUserValue;
    return currentUser && currentUser.token ? currentUser.token : '';
  }
}
