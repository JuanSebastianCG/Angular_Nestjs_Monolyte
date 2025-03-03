import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface CourseRef {
  _id: string;
  name: string;
  description: string;
  professorId: string;
  scheduleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Enrollment {
  _id?: string;
  studentId: string;
  courseId: string | CourseRef; // Puede ser un string o un objeto con detalles del curso
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  status: 'start' | 'finish';
  grade?: number;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private apiUrl = `${environment.apiUrl}/enrollments`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all enrollments
  getAllEnrollments(): Observable<Enrollment[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Enrollment[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrollment by ID
  getEnrollmentById(id: string): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Enrollment>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrollments by student ID
  getEnrollmentsByStudent(studentId: string): Observable<Enrollment[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Enrollment[]>(`${this.apiUrl}/student/${studentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrollments by course ID
  getEnrollmentsByCourse(courseId: string): Observable<Enrollment[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Enrollment[]>(`${this.apiUrl}/course/${courseId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Create a new enrollment
  createEnrollment(enrollment: Enrollment): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    console.log(enrollment);
    console.log(headers);
    console.log(this.apiUrl);
    console.log(this.http);


    return this.http
      .post<Enrollment>(this.apiUrl, enrollment, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update an enrollment
  updateEnrollment(
    id: string,
    enrollment: Partial<Enrollment>,
  ): Observable<Enrollment> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Enrollment>(`${this.apiUrl}/${id}`, enrollment, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete an enrollment
  deleteEnrollment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers })
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
    console.error('An error occurred in EnrollmentService', error);
    return throwError(() => error);
  }
}
