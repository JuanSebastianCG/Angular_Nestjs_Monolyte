import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from '../components/notification/notification.service';

export interface Professor {
  _id: string;
  userId: string;
  name: string;
  email?: string;
  hiringDate?: string;
  departmentId?: string;
  departmentName?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateProfessorDto {
  userId: string;
  departmentId?: string;
  hiringDate?: string;
}

export interface UpdateProfessorDto {
  departmentId?: string;
  hiringDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProfessorService {
  private apiUrl = `${environment.apiUrl}/professors`;
  private usersUrl = `${environment.apiUrl}/users`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all professors
   */
  getAllProfessors(): Observable<Professor[]> {
    return this.http
      .get<Professor[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        tap((professors) =>
          console.log(`Retrieved ${professors.length} professors`),
        ),
        catchError(this.handleError('Failed to retrieve professors')),
      );
  }

  /**
   * Get a professor by ID
   * @param id The ID of the professor
   */
  getProfessorById(id: string): Observable<Professor> {
    return this.http
      .get<Professor>(`${this.apiUrl}/${id}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((professor) =>
          console.log(`Retrieved professor: ${professor.name}`),
        ),
        catchError(this.handleError(`Failed to retrieve professor ${id}`)),
      );
  }

  /**
   * Get professors by department
   * @param departmentId The ID of the department
   */
  getProfessorsByDepartment(departmentId: string): Observable<Professor[]> {
    return this.http
      .get<
        Professor[]
      >(`${this.apiUrl}/department/${departmentId}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((professors) =>
          console.log(
            `Retrieved ${professors.length} professors for department ${departmentId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve professors for department ${departmentId}`,
          ),
        ),
      );
  }

  /**
   * Get a professor by user ID
   * @param userId The ID of the user
   */
  getProfessorByUserId(userId: string): Observable<Professor> {
    return this.http
      .get<Professor>(`${this.apiUrl}/user/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((professor) =>
          professor
            ? console.log(`Retrieved professor for user ${userId}`)
            : console.log(`No professor found for user ${userId}`),
        ),
        catchError((error) => {
          if (error.status === 404) {
            // Not found is expected in some cases
            return of(null);
          }
          return this.handleError(
            `Failed to retrieve professor for user ${userId}`,
          )(error);
        }),
      );
  }

  /**
   * Create a new professor
   * @param professor The professor data to create
   */
  createProfessor(professor: CreateProfessorDto): Observable<Professor> {
    return this.http
      .post<Professor>(this.apiUrl, professor, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((newProfessor) => {
          console.log(`Created professor for user ${professor.userId}`);
          this.notificationService.success('Professor created successfully');
        }),
        catchError(this.handleError('Failed to create professor')),
      );
  }

  /**
   * Update a professor
   * @param id The ID of the professor to update
   * @param professor The professor data to update
   */
  updateProfessor(
    id: string,
    professor: UpdateProfessorDto,
  ): Observable<Professor> {
    return this.http
      .patch<Professor>(`${this.apiUrl}/${id}`, professor, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((updatedProfessor) => {
          console.log(`Updated professor ${updatedProfessor._id}`);
          this.notificationService.success('Professor updated successfully');
        }),
        catchError(this.handleError(`Failed to update professor ${id}`)),
      );
  }

  /**
   * Delete a professor
   * @param id The ID of the professor to delete
   */
  deleteProfessor(id: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          console.log(`Deleted professor ${id}`);
          this.notificationService.success('Professor deleted successfully');
        }),
        catchError(this.handleError(`Failed to delete professor ${id}`)),
      );
  }

  /**
   * Assign a professor to a department
   * @param professorId The ID of the professor
   * @param departmentId The ID of the department
   */
  assignToDepartment(
    professorId: string,
    departmentId: string,
  ): Observable<Professor> {
    return this.updateProfessor(professorId, { departmentId });
  }

  /**
   * Remove a professor from a department
   * @param professorId The ID of the professor
   */
  removeFromDepartment(professorId: string): Observable<Professor> {
    return this.updateProfessor(professorId, { departmentId: null });
  }

  /**
   * Get professors without a department
   */
  getProfessorsWithoutDepartment(): Observable<Professor[]> {
    return this.getAllProfessors().pipe(
      map((professors) => professors.filter((p) => !p.departmentId)),
    );
  }

  /**
   * Search professors by name
   * @param name The name to search for
   */
  searchProfessorsByName(name: string): Observable<Professor[]> {
    if (!name || name.trim() === '') {
      return of([]);
    }

    return this.http
      .get<
        Professor[]
      >(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((professors) =>
          console.log(
            `Found ${professors.length} professors matching "${name}"`,
          ),
        ),
        catchError(
          this.handleError(`Failed to search professors with name "${name}"`),
        ),
      );
  }

  /**
   * Get professors with course count
   */
  getProfessorsWithCourseCount(): Observable<
    (Professor & { courseCount: number })[]
  > {
    return this.getAllProfessors().pipe(
      map((professors) => {
        // For each professor, we would typically fetch their courses
        // This is a placeholder that would be implemented with real API calls
        return professors.map((professor) => ({
          ...professor,
          courseCount: 0, // This would be replaced with actual course count
        }));
      }),
      catchError((error) => {
        console.error('Error getting professors with course count:', error);
        this.notificationService.error(
          'Failed to retrieve professors with course count',
        );
        return of([]);
      }),
    );
  }

  /**
   * Generate headers with authentication token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Error handler function
   * @param operation Description of the operation that failed
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`${operation}:`, error);
      if (error.status === 401) {
        this.notificationService.error(
          'Your session has expired. Please log in again.',
        );
        this.authService.logout();
      } else {
        this.notificationService.error(
          `${operation}: ${error.error?.message || error.message || 'Unknown error'}`,
        );
      }
      return throwError(() => error);
    };
  }
}
