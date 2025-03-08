import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from '../components/notification/notification.service';

export interface Student {
  _id: string;
  userId: string;
  name: string;
  email?: string;
  birthDate?: string;
  enrollmentDate?: string;
  status?: 'active' | 'inactive' | 'graduated';
  createdAt?: string;
  updatedAt?: string;
}

export interface StudentAcademicInfo {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  averageGrade: number;
}

export interface CreateStudentDto {
  userId: string;
  enrollmentDate?: string;
}

export interface UpdateStudentDto {
  status?: 'active' | 'inactive' | 'graduated';
  enrollmentDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StudentService {
  private apiUrl = `${environment.apiUrl}/students`;
  private usersUrl = `${environment.apiUrl}/users`;
  private enrollmentsUrl = `${environment.apiUrl}/enrollments`;
  private gradesUrl = `${environment.apiUrl}/student-grades`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all students
   */
  getAllStudents(): Observable<Student[]> {
    return this.http
      .get<Student[]>(this.apiUrl, { headers: this.getAuthHeaders() })
      .pipe(
        tap((students) => console.log(`Retrieved ${students.length} students`)),
        catchError(this.handleError('Failed to retrieve students')),
      );
  }

  /**
   * Get a student by ID
   * @param id The ID of the student
   */
  getStudentById(id: string): Observable<Student> {
    return this.http
      .get<Student>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((student) => console.log(`Retrieved student: ${student.name}`)),
        catchError(this.handleError(`Failed to retrieve student ${id}`)),
      );
  }

  /**
   * Get a student by user ID
   * @param userId The ID of the user
   */
  getStudentByUserId(userId: string): Observable<Student> {
    return this.http
      .get<Student>(`${this.apiUrl}/user/${userId}`, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((student) =>
          student
            ? console.log(`Retrieved student for user ${userId}`)
            : console.log(`No student found for user ${userId}`),
        ),
        catchError((error) => {
          if (error.status === 404) {
            // Not found is expected in some cases
            return of(null);
          }
          return this.handleError(
            `Failed to retrieve student for user ${userId}`,
          )(error);
        }),
      );
  }

  /**
   * Create a new student
   * @param student The student data to create
   */
  createStudent(student: CreateStudentDto): Observable<Student> {
    return this.http
      .post<Student>(this.apiUrl, student, { headers: this.getAuthHeaders() })
      .pipe(
        tap((newStudent) => {
          console.log(`Created student for user ${student.userId}`);
          this.notificationService.success('Student created successfully');
        }),
        catchError(this.handleError('Failed to create student')),
      );
  }

  /**
   * Update a student
   * @param id The ID of the student to update
   * @param student The student data to update
   */
  updateStudent(id: string, student: UpdateStudentDto): Observable<Student> {
    return this.http
      .patch<Student>(`${this.apiUrl}/${id}`, student, {
        headers: this.getAuthHeaders(),
      })
      .pipe(
        tap((updatedStudent) => {
          console.log(`Updated student ${updatedStudent._id}`);
          this.notificationService.success('Student updated successfully');
        }),
        catchError(this.handleError(`Failed to update student ${id}`)),
      );
  }

  /**
   * Delete a student
   * @param id The ID of the student to delete
   */
  deleteStudent(id: string): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap(() => {
          console.log(`Deleted student ${id}`);
          this.notificationService.success('Student deleted successfully');
        }),
        catchError(this.handleError(`Failed to delete student ${id}`)),
      );
  }

  /**
   * Get students by status
   * @param status The status to filter by ('active', 'inactive', 'graduated')
   */
  getStudentsByStatus(
    status: 'active' | 'inactive' | 'graduated',
  ): Observable<Student[]> {
    return this.http
      .get<
        Student[]
      >(`${this.apiUrl}/status/${status}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((students) =>
          console.log(
            `Retrieved ${students.length} students with status ${status}`,
          ),
        ),
        catchError(
          this.handleError(`Failed to retrieve students with status ${status}`),
        ),
      );
  }

  /**
   * Search students by name
   * @param name The name to search for
   */
  searchStudentsByName(name: string): Observable<Student[]> {
    if (!name || name.trim() === '') {
      return of([]);
    }

    return this.http
      .get<
        Student[]
      >(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((students) =>
          console.log(`Found ${students.length} students matching "${name}"`),
        ),
        catchError(
          this.handleError(`Failed to search students with name "${name}"`),
        ),
      );
  }

  /**
   * Get students enrolled in a course
   * @param courseId The ID of the course
   */
  getStudentsInCourse(courseId: string): Observable<Student[]> {
    return this.http
      .get<
        any[]
      >(`${this.enrollmentsUrl}/course/${courseId}`, { headers: this.getAuthHeaders() })
      .pipe(
        map((enrollments) => {
          // Extract student information from enrollments
          const students = enrollments.map((enrollment) => {
            const studentInfo =
              typeof enrollment.studentId === 'object'
                ? enrollment.studentId
                : { _id: enrollment.studentId };

            return {
              ...studentInfo,
              enrollmentDate: enrollment.enrollmentStartDate,
              status: enrollment.status,
            };
          });

          return students;
        }),
        tap((students) =>
          console.log(
            `Retrieved ${students.length} students enrolled in course ${courseId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve students enrolled in course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Get academic information for a student
   * @param studentId The ID of the student
   */
  getStudentAcademicInfo(studentId: string): Observable<StudentAcademicInfo> {
    // Get enrollments for the student
    return this.http
      .get<
        any[]
      >(`${this.enrollmentsUrl}/student/${studentId}`, { headers: this.getAuthHeaders() })
      .pipe(
        switchMap((enrollments) => {
          // Get grades for the student
          return this.http
            .get<
              any[]
            >(`${this.gradesUrl}/student/${studentId}`, { headers: this.getAuthHeaders() })
            .pipe(
              map((grades) => {
                const totalCourses = enrollments.length;
                const completedCourses = enrollments.filter(
                  (e) => e.status === 'completed',
                ).length;
                const enrolledCourses = enrollments.filter(
                  (e) => e.status === 'active' || e.status === 'start',
                ).length;

                // Calculate average grade if grades exist
                let averageGrade = 0;
                if (grades.length > 0) {
                  const sum = grades.reduce((total, grade) => {
                    return (
                      total +
                      (typeof grade.grade === 'number'
                        ? grade.grade
                        : grade.value || 0)
                    );
                  }, 0);
                  averageGrade = parseFloat((sum / grades.length).toFixed(1));
                }

                return {
                  totalCourses,
                  enrolledCourses,
                  completedCourses,
                  averageGrade,
                };
              }),
            );
        }),
        tap((info) =>
          console.log(`Retrieved academic info for student ${studentId}`),
        ),
        catchError((error) => {
          console.error('Error getting student academic info:', error);
          this.notificationService.error(
            'Failed to retrieve student academic information',
          );
          return of({
            totalCourses: 0,
            enrolledCourses: 0,
            completedCourses: 0,
            averageGrade: 0,
          });
        }),
      );
  }

  /**
   * Get course recommendations for a student
   * @param studentId The ID of the student
   * @param limit Maximum number of recommendations to return
   */
  getCourseRecommendations(
    studentId: string,
    limit: number = 5,
  ): Observable<any[]> {
    // This would typically involve complex business logic on the backend
    // For now, we'll simulate it with a basic implementation
    return this.http
      .get<
        any[]
      >(`${this.apiUrl}/${studentId}/recommendations?limit=${limit}`, { headers: this.getAuthHeaders() })
      .pipe(
        tap((courses) =>
          console.log(
            `Retrieved ${courses.length} course recommendations for student ${studentId}`,
          ),
        ),
        catchError((error) => {
          console.error('Error getting course recommendations:', error);
          this.notificationService.error(
            'Failed to retrieve course recommendations',
          );
          return of([]);
        }),
      );
  }

  /**
   * Get the academic progress of a student
   * @param studentId The ID of the student
   */
  getStudentProgress(studentId: string): Observable<{
    totalCredits: number;
    completedCredits: number;
    progressPercentage: number;
    estimatedGraduationDate: string;
  }> {
    // This would typically be implemented on the backend
    // For now, we'll return a mock implementation
    return of({
      totalCredits: 120,
      completedCredits: 45,
      progressPercentage: 37.5,
      estimatedGraduationDate: new Date(
        new Date().setFullYear(new Date().getFullYear() + 2),
      )
        .toISOString()
        .split('T')[0],
    }).pipe(
      tap(() =>
        console.log(`Retrieved progress information for student ${studentId}`),
      ),
      catchError((error) => {
        console.error('Error getting student progress:', error);
        this.notificationService.error('Failed to retrieve student progress');
        return of({
          totalCredits: 0,
          completedCredits: 0,
          progressPercentage: 0,
          estimatedGraduationDate: '',
        });
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
