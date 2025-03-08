import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { ApiService } from './api.service';
import {
  User,
  LoginUserDto,
  LoginResponse,
  UserProfessor,
  UserStudent,
} from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';

  constructor(private apiService: ApiService) {
    this.loadUserFromStorage();
  }

  /**
   * Load user data from local storage on service initialization
   */
  private loadUserFromStorage(): void {
    const userData = localStorage.getItem(this.USER_DATA_KEY);
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Error parsing user data from local storage', e);
        this.logout();
      }
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getAccessToken() && !!this.currentUserSubject.value;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    try {
      const userData = localStorage.getItem(this.USER_DATA_KEY);
      if (userData) {
        return JSON.parse(userData);
      }
      return null;
    } catch (error) {
      console.error('Error retrieving user data from storage:', error);
      return null;
    }
  }

  /**
   * Check if user is a professor
   */
  isProfessor(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'professor';
  }

  /**
   * Check if user is a student
   */
  isStudent(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'student';
  }

  /**
   * Check if user is an admin
   */
  isAdmin(): boolean {
    const user = this.currentUserSubject.value;
    return !!user && user.role === 'admin';
  }

  /**
   * Login user with username and password
   */
  login(loginData: LoginUserDto): Observable<LoginResponse> {
    return this.apiService.post<LoginResponse>('auth/login', loginData).pipe(
      tap((response) => {
        this.setTokens(response.access_token, response.refresh_token);
        this.storeUserData(response.user);
        this.currentUserSubject.next(response.user);
      }),
    );
  }

  /**
   * Register a new user
   */
  register(userData: any): Observable<User> {
    return this.apiService.post<User>('users', userData);
  }

  /**
   * Register an admin user (admin only)
   */
  registerAdmin(userData: any): Observable<User> {
    return this.apiService.post<User>('users/admin', userData);
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.apiService.get<User>('auth/profile').pipe(
      tap((user) => {
        this.storeUserData(user);
        this.currentUserSubject.next(user);
      }),
    );
  }

  /**
   * Refresh access token using refresh token
   */
  refreshToken(): Observable<{ access_token: string; refresh_token: string }> {
    const refreshToken = this.getRefreshToken();
    return this.apiService
      .post<{ access_token: string; refresh_token: string }>('auth/refresh', {})
      .pipe(
        tap((tokens) => {
          this.setTokens(tokens.access_token, tokens.refresh_token);
        }),
      );
  }

  /**
   * Logout user
   */
  logout(): Observable<any> {
    // Call the logout endpoint if the user is authenticated
    if (this.isAuthenticated()) {
      return this.apiService
        .post<any>('auth/logout', {})
        .pipe(tap(() => this.clearAuthData()));
    }

    // Otherwise, just clear the auth data without making an API call
    this.clearAuthData();
    return new Observable((observer) => {
      observer.next({});
      observer.complete();
    });
  }

  /**
   * Clear authentication data
   */
  private clearAuthData(): void {
    localStorage.removeItem(this.ACCESS_TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_DATA_KEY);
    this.currentUserSubject.next(null);
  }

  /**
   * Store tokens in local storage
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  /**
   * Store user data in local storage
   */
  private storeUserData(user: User): void {
    if (!user) return;

    // Ensure user has at least username if name is missing
    const userData = {
      ...user,
      // Set default name to username if not provided
      name: user.name || user.username,
    };

    localStorage.setItem(this.USER_DATA_KEY, JSON.stringify(userData));
    this.currentUserSubject.next(userData);
  }

  /**
   * Get access token from local storage
   */
  getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from local storage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  getUserDisplayName(): string {
    const user = this.getCurrentUser();
    return user?.name || user?.username || 'Usuario';
  }
}
