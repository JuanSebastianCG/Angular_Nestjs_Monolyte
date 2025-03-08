import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, forkJoin, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from '../components/notification/notification.service';
import { StudentGrade } from '../models/student-grade.model';
import { Evaluation } from '../models/evaluation.model';

export interface GradeWithDetails extends StudentGrade {
  evaluationName?: string;
  studentName?: string;
  courseName?: string;
}

export interface CreateGradeDto {
  studentId: string;
  evaluationId: string;
  grade: number;
  comments?: string;
}

export interface UpdateGradeDto {
  grade?: number;
  comments?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GradeService {
  private apiUrl = `${environment.apiUrl}/student-grades`;
  private evaluationsUrl = `${environment.apiUrl}/evaluations`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all grades
   */
  getAllGrades(): Observable<StudentGrade[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<StudentGrade[]>(this.apiUrl, { headers }).pipe(
      tap((grades) => console.log('Fetched all grades', grades)),
      catchError(this.handleError('getAllGrades')),
    );
  }

  /**
   * Get grades for a specific student
   */
  getGradesByStudent(studentId: string): Observable<GradeWithDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<StudentGrade[]>(`${this.apiUrl}/student/${studentId}`, { headers })
      .pipe(
        tap((grades) =>
          console.log(`Fetched grades for student ${studentId}`, grades),
        ),
        map((grades) => this.addDetailsToGrades(grades)),
        catchError(this.handleError('getGradesByStudent')),
      );
  }

  /**
   * Get grades for a specific evaluation
   */
  getGradesByEvaluation(evaluationId: string): Observable<StudentGrade[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        StudentGrade[]
      >(`${this.apiUrl}/evaluation/${evaluationId}`, { headers })
      .pipe(
        tap((grades) =>
          console.log(`Fetched grades for evaluation ${evaluationId}`, grades),
        ),
        catchError(this.handleError('getGradesByEvaluation')),
      );
  }

  /**
   * Get grades for a specific course
   */
  getGradesByCourse(courseId: string): Observable<GradeWithDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<StudentGrade[]>(`${this.apiUrl}/course/${courseId}`, { headers })
      .pipe(
        tap((grades) =>
          console.log(`Fetched grades for course ${courseId}`, grades),
        ),
        map((grades) => this.addDetailsToGrades(grades)),
        catchError(this.handleError('getGradesByCourse')),
      );
  }

  /**
   * Get a student's grades in a specific course
   */
  getStudentGradesInCourse(
    studentId: string,
    courseId: string,
  ): Observable<GradeWithDetails[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        StudentGrade[]
      >(`${this.apiUrl}/student/${studentId}/course/${courseId}`, { headers })
      .pipe(
        tap((grades) =>
          console.log(
            `Fetched grades for student ${studentId} in course ${courseId}`,
            grades,
          ),
        ),
        map((grades) => this.addDetailsToGrades(grades)),
        catchError(this.handleError('getStudentGradesInCourse')),
      );
  }

  /**
   * Get a specific grade by evaluation and student
   */
  getGradeByEvaluationAndStudent(
    evaluationId: string,
    studentId: string,
  ): Observable<StudentGrade> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<StudentGrade>(
        `${this.apiUrl}/evaluation/${evaluationId}/student/${studentId}`,
        { headers },
      )
      .pipe(
        tap((grade) =>
          console.log(
            `Fetched grade for student ${studentId} on evaluation ${evaluationId}`,
            grade,
          ),
        ),
        catchError(this.handleError('getGradeByEvaluationAndStudent')),
      );
  }

  /**
   * Create a new grade
   */
  createGrade(grade: CreateGradeDto): Observable<StudentGrade> {
    const headers = this.getAuthHeaders();
    return this.http.post<StudentGrade>(this.apiUrl, grade, { headers }).pipe(
      tap((newGrade) => {
        console.log('Created grade', newGrade);
        this.notificationService.success('Grade created successfully');
      }),
      catchError(this.handleError('createGrade')),
    );
  }

  /**
   * Update a grade
   */
  updateGrade(
    evaluationId: string,
    studentId: string,
    grade: UpdateGradeDto,
  ): Observable<StudentGrade> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<StudentGrade>(
        `${this.apiUrl}/evaluation/${evaluationId}/student/${studentId}`,
        grade,
        { headers },
      )
      .pipe(
        tap((updatedGrade) => {
          console.log('Updated grade', updatedGrade);
          this.notificationService.success('Grade updated successfully');
        }),
        catchError(this.handleError('updateGrade')),
      );
  }

  /**
   * Delete a grade
   */
  deleteGrade(evaluationId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete(
        `${this.apiUrl}/evaluation/${evaluationId}/student/${studentId}`,
        { headers },
      )
      .pipe(
        tap((_) => {
          console.log(
            `Deleted grade for student ${studentId} on evaluation ${evaluationId}`,
          );
          this.notificationService.success('Grade deleted successfully');
        }),
        catchError(this.handleError('deleteGrade')),
      );
  }

  /**
   * Calculate average grade for a student in a course
   */
  calculateStudentAverage(
    studentId: string,
    courseId: string,
  ): Observable<number> {
    return this.getStudentGradesInCourse(studentId, courseId).pipe(
      map((grades) => {
        if (grades.length === 0) return 0;
        const sum = grades.reduce((total, grade) => total + grade.grade, 0);
        return Math.round((sum / grades.length) * 100) / 100;
      }),
      catchError((error) => {
        console.error('Error calculating student average:', error);
        return of(0);
      }),
    );
  }

  /**
   * Get course average grades for all students
   */
  getCourseAverages(
    courseId: string,
  ): Observable<{ studentId: string; studentName: string; average: number }[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<StudentGrade[]>(`${this.apiUrl}/course/${courseId}`, { headers })
      .pipe(
        map((grades) => {
          // Group grades by student
          const studentGrades = grades.reduce(
            (acc, grade) => {
              const studentId = grade.studentId.toString();
              if (!acc[studentId]) {
                acc[studentId] = {
                  grades: [],
                  studentName: grade.studentName || 'Unknown Student',
                };
              }
              acc[studentId].grades.push(grade);
              return acc;
            },
            {} as Record<
              string,
              { grades: StudentGrade[]; studentName: string }
            >,
          );

          // Calculate average for each student
          return Object.entries(studentGrades).map(([studentId, data]) => {
            const sum = data.grades.reduce(
              (total, grade) => total + grade.grade,
              0,
            );
            const average = Math.round((sum / data.grades.length) * 100) / 100;
            return {
              studentId,
              studentName: data.studentName,
              average,
            };
          });
        }),
        catchError(this.handleError('getCourseAverages')),
      );
  }

  /**
   * Add details to grades
   */
  private addDetailsToGrades(grades: StudentGrade[]): GradeWithDetails[] {
    // This function would typically fetch additional details from other entities
    // For now, we'll just pass through the data
    return grades as GradeWithDetails[];
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Error handler
   */
  private handleError(operation: string) {
    return (error: any): Observable<any> => {
      console.error(`${operation} failed:`, error);
      this.notificationService.error(
        `Failed to ${operation.replace(/([A-Z])/g, ' $1').toLowerCase()}`,
      );
      return throwError(() => error);
    };
  }
}
