import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

export interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
}

export interface Course {
  _id: string;
  name: string;
  description: string;
  professorId: string;
  professor?: string;
  department?: string;
  departmentId?: string;
  schedule?: Schedule;
  enrolledStudents?: any[];
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all courses
  getAllCourses(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get courses by department ID
  getCoursesByDepartment(departmentId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/department/${departmentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get courses by professor ID
  getCoursesByProfessor(professorId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/professor/${professorId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get course by ID
  getCourseById(id: string): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get multiple courses by IDs
  getCoursesById(ids: string[]): Observable<Course[]> {
    if (!ids || ids.length === 0) {
      return of([]);
    }

    const headers = this.getAuthHeaders();
    // Join the ids with commas for a query parameter
    const idsParam = ids.join(',');
    return this.http
      .get<Course[]>(`${this.apiUrl}/byIds?ids=${idsParam}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Create a new course
  createCourse(course: Partial<Course>): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Course>(this.apiUrl, course, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update a course
  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Course>(`${this.apiUrl}/${id}`, course, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete a course
  deleteCourse(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrolled students for a course
  getEnrolledStudents(courseId: string): Observable<any[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any[]>(`${this.apiUrl}/${courseId}/students`, { headers })
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
    console.error('An error occurred in CourseService', error);
    return throwError(() => error);
  }
}
