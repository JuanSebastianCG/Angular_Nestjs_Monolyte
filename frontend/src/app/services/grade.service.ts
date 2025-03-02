import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Grade {
  _id: string;
  studentId: string;
  courseId: string;
  value: number;
  date: string;
  comments?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  private apiUrl = `${environment.apiUrl}/api/grades`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all grades
  getAllGrades(): Observable<Grade[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Grade[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get grade by ID
  getGradeById(id: string): Observable<Grade> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Grade>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get grades by student ID
  getGradesByStudent(studentId: string): Observable<Grade[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Grade[]>(`${this.apiUrl}/student/${studentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get grades by course ID
  getGradesByCourse(courseId: string): Observable<Grade[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Grade[]>(`${this.apiUrl}/course/${courseId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get grade by student and course
  getGradeByStudentAndCourse(
    studentId: string,
    courseId: string,
  ): Observable<Grade> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Grade>(`${this.apiUrl}/student/${studentId}/course/${courseId}`, {
        headers,
      })
      .pipe(catchError(this.handleError));
  }

  // Create a new grade
  createGrade(grade: Omit<Grade, '_id'>): Observable<Grade> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Grade>(this.apiUrl, grade, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update a grade
  updateGrade(id: string, grade: Partial<Grade>): Observable<Grade> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Grade>(`${this.apiUrl}/${id}`, grade, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete a grade
  deleteGrade(id: string): Observable<any> {
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
    console.error('An error occurred in GradeService', error);
    return throwError(() => error);
  }
}
