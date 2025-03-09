import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, of, catchError } from 'rxjs';
import { environment } from '../../environments/environment';
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
  private baseUrl = environment.apiUrl;
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private readonly ACCESS_TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_DATA_KEY = 'user_data';

  constructor(private http: HttpClient) {
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
        this.clearAuthData();
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
    return this.http
      .post<LoginResponse>(`${this.baseUrl}/auth/login`, loginData)
      .pipe(
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
    return this.http.post<User>(`${this.baseUrl}/users`, userData);
  }

  /**
   * Register an admin user (admin only)
   */
  registerAdmin(userData: any): Observable<User> {
    return this.http.post<User>(`${this.baseUrl}/users/admin`, userData);
  }

  /**
   * Get user profile
   */
  getProfile(): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/auth/profile`).pipe(
      tap((user) => {
        this.storeUserData(user);
        this.currentUserSubject.next(user);
      }),
    );
  }

  /**
   * Logout user
   * POST /auth/logout
   *
   * This method always clears the local authentication data (tokens and user info)
   * regardless of the server response. Even if the server returns a 400 error
   * (invalid or missing token), the user will still be logged out locally.
   */
  logout(): Observable<any> {
    // Call the logout endpoint if the user is authenticated
    if (this.isAuthenticated()) {
      const accessToken = this.getAccessToken();

      // Create headers with Authorization token
      const headers = new HttpHeaders({
        Authorization: `Bearer ${accessToken}`,
      });

      // Make the POST request to logout with explicit Authorization header
      return this.http
        .post<any>(`${this.baseUrl}/auth/logout`, {}, { headers })
        .pipe(
          tap(() => {
            // Always clear auth data after successful logout
            this.clearAuthData();
          }),
          catchError((error) => {
            // Always clear auth data even if the server request fails
            console.error('Logout error', error);
            this.clearAuthData();
            return of({ success: false, error });
          }),
        );
    }

    // Otherwise, just clear the auth data without making an API call
    this.clearAuthData();
    return of({ success: true });
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
