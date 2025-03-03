import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Department {
  _id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all departments
  getAllDepartments(): Observable<Department[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Department[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get department by ID
  getDepartmentById(id: string): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Department>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Create a new department
  createDepartment(
    department: Omit<Department, '_id'>,
  ): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Department>(this.apiUrl, department, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update a department
  updateDepartment(
    id: string,
    department: Partial<Department>,
  ): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Department>(`${this.apiUrl}/${id}`, department, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete a department
  deleteDepartment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Search departments by name
  searchDepartments(name: string): Observable<Department[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Department[]>(`${this.apiUrl}/search`, { headers, params: { name } })
      .pipe(catchError(this.handleError));
  }

  // Get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Error handler
  private handleError(error: any) {
    console.error('An error occurred in DepartmentService', error);
    return throwError(() => error);
  }
}
