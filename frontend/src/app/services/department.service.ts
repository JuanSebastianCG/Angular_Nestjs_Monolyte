import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from '../components/notification/notification.service';

export interface Department {
  _id: string;
  name: string;
  description: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDepartmentDto {
  name: string;
  description: string;
}

export interface UpdateDepartmentDto {
  name?: string;
  description?: string;
}

export interface DepartmentWithProfessors extends Department {
  professors: Professor[];
}

export interface DepartmentWithCourses extends Department {
  courses: any[];
}

export interface Professor {
  _id: string;
  name: string;
  email?: string;
  hiringDate?: string;
  departmentId?: string;
}

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private apiUrl = `${environment.apiUrl}/departments`;
  private professorsUrl = `${environment.apiUrl}/professors`;
  private coursesUrl = `${environment.apiUrl}/courses`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all departments
   */
  getAllDepartments(): Observable<Department[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Department[]>(this.apiUrl, { headers }).pipe(
      tap((departments) =>
        console.log(`Retrieved ${departments.length} departments`),
      ),
      catchError(this.handleError('Failed to retrieve departments')),
    );
  }

  /**
   * Get department by ID
   * @param id The ID of the department
   */
  getDepartmentById(id: string): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http.get<Department>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap((department) =>
        console.log(`Retrieved department: ${department.name}`),
      ),
      catchError(this.handleError(`Failed to retrieve department ${id}`)),
    );
  }

  /**
   * Get department with professors
   * @param id The ID of the department
   */
  getDepartmentWithProfessors(
    id: string,
  ): Observable<DepartmentWithProfessors> {
    return this.getDepartmentById(id).pipe(
      switchMap((department) => {
        // Get professors in this department
        return this.http
          .get<
            Professor[]
          >(`${this.professorsUrl}/department/${id}`, { headers: this.getAuthHeaders() })
          .pipe(
            map((professors) => ({
              ...department,
              professors,
            })),
          );
      }),
      tap((result) =>
        console.log(
          `Retrieved department with ${result.professors.length} professors`,
        ),
      ),
      catchError(
        this.handleError(`Failed to retrieve department ${id} with professors`),
      ),
    );
  }

  /**
   * Get department with courses
   * @param id The ID of the department
   */
  getDepartmentWithCourses(id: string): Observable<DepartmentWithCourses> {
    return this.getDepartmentById(id).pipe(
      switchMap((department) => {
        // Get courses in this department
        return this.http
          .get<
            any[]
          >(`${this.coursesUrl}/department/${id}`, { headers: this.getAuthHeaders() })
          .pipe(
            map((courses) => ({
              ...department,
              courses,
            })),
          );
      }),
      tap((result) =>
        console.log(
          `Retrieved department with ${result.courses.length} courses`,
        ),
      ),
      catchError(
        this.handleError(`Failed to retrieve department ${id} with courses`),
      ),
    );
  }

  /**
   * Create a new department
   * @param department The department data to create
   */
  createDepartment(department: CreateDepartmentDto): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Department>(this.apiUrl, department, { headers })
      .pipe(
        tap((newDepartment) => {
          console.log(`Created department: ${newDepartment.name}`);
          this.notificationService.success('Department created successfully');
        }),
        catchError(this.handleError('Failed to create department')),
      );
  }

  /**
   * Update a department
   * @param id The ID of the department to update
   * @param department The department data to update
   */
  updateDepartment(
    id: string,
    department: UpdateDepartmentDto,
  ): Observable<Department> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<Department>(`${this.apiUrl}/${id}`, department, { headers })
      .pipe(
        tap((updatedDepartment) => {
          console.log(`Updated department: ${updatedDepartment.name}`);
          this.notificationService.success('Department updated successfully');
        }),
        catchError(this.handleError(`Failed to update department ${id}`)),
      );
  }

  /**
   * Delete a department
   * @param id The ID of the department to delete
   */
  deleteDepartment(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        console.log(`Deleted department ${id}`);
        this.notificationService.success('Department deleted successfully');
      }),
      catchError(this.handleError(`Failed to delete department ${id}`)),
    );
  }

  /**
   * Search departments by name
   * @param name The name to search for
   */
  searchDepartments(name: string): Observable<Department[]> {
    if (!name || name.trim() === '') {
      return of([]);
    }

    const headers = this.getAuthHeaders();
    return this.http
      .get<Department[]>(`${this.apiUrl}/search`, { headers, params: { name } })
      .pipe(
        tap((departments) =>
          console.log(
            `Found ${departments.length} departments matching "${name}"`,
          ),
        ),
        catchError(
          this.handleError(`Failed to search departments with name "${name}"`),
        ),
      );
  }

  /**
   * Get professors by department
   * @param departmentId The ID of the department
   */
  getProfessorsByDepartment(departmentId: string): Observable<Professor[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Professor[]
      >(`${this.professorsUrl}/department/${departmentId}`, { headers })
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
   * Assign professor to department
   * @param professorId The ID of the professor
   * @param departmentId The ID of the department
   */
  assignProfessorToDepartment(
    professorId: string,
    departmentId: string,
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<any>(
        `${this.professorsUrl}/${professorId}`,
        { departmentId },
        { headers },
      )
      .pipe(
        tap(() => {
          console.log(
            `Assigned professor ${professorId} to department ${departmentId}`,
          );
          this.notificationService.success(
            'Professor assigned to department successfully',
          );
        }),
        catchError(
          this.handleError(
            `Failed to assign professor ${professorId} to department ${departmentId}`,
          ),
        ),
      );
  }

  /**
   * Get all departments with statistics
   * This provides extended information like course count, professor count, etc.
   */
  getDepartmentsWithStatistics(): Observable<
    (Department & { professorCount: number; courseCount: number })[]
  > {
    return this.getAllDepartments().pipe(
      switchMap((departments) => {
        if (departments.length === 0) {
          return of([]);
        }

        // Create requests for each department to get professors and courses counts
        const departmentRequests = departments.map((department) => {
          return forkJoin({
            professors: this.getProfessorsByDepartment(department._id).pipe(
              catchError(() => of([])),
            ),
            courses: this.http
              .get<
                any[]
              >(`${this.coursesUrl}/department/${department._id}`, { headers: this.getAuthHeaders() })
              .pipe(catchError(() => of([]))),
          }).pipe(
            map(({ professors, courses }) => ({
              ...department,
              professorCount: professors.length,
              courseCount: courses.length,
            })),
          );
        });

        return forkJoin(departmentRequests);
      }),
      tap((departmentsWithStats) =>
        console.log(
          `Retrieved ${departmentsWithStats.length} departments with statistics`,
        ),
      ),
      catchError((error) => {
        console.error('Error getting departments with statistics:', error);
        this.notificationService.error(
          'Failed to retrieve departments with statistics',
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
