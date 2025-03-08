import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError, of, forkJoin } from 'rxjs';
import { catchError, map, finalize, tap, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NotificationService } from '../components/notification/notification.service';
import { Evaluation } from '../models/evaluation.model';
import { StudentGrade } from '../models/student-grade.model';

export interface CreateEvaluationDto {
  courseId: string;
  name: string;
  description?: string;
  maxScore: number;
  evaluationDate: string;
}

export interface UpdateEvaluationDto {
  name?: string;
  description?: string;
  maxScore?: number;
  evaluationDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  private apiUrl = `${environment.apiUrl}/evaluations`;
  private gradesUrl = `${environment.apiUrl}/student-grades`;
  private coursesUrl = `${environment.apiUrl}/courses`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all evaluations
   */
  getAllEvaluations(): Observable<Evaluation[]> {
    const headers = this.getAuthHeaders();
    return this.http.get<Evaluation[]>(this.apiUrl, { headers }).pipe(
      tap((evaluations) => console.log('Fetched all evaluations', evaluations)),
      catchError(this.handleError('getAllEvaluations')),
    );
  }

  /**
   * Get evaluations by course ID
   */
  getEvaluationsByCourse(courseId: string): Observable<Evaluation[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Evaluation[]>(`${this.apiUrl}/course/${courseId}`, { headers })
      .pipe(
        tap((evaluations) =>
          console.log(
            `Fetched evaluations for course ${courseId}`,
            evaluations,
          ),
        ),
        catchError(this.handleError('getEvaluationsByCourse')),
      );
  }

  /**
   * Get evaluation by ID
   */
  getEvaluationById(evaluationId: string): Observable<Evaluation> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Evaluation>(`${this.apiUrl}/${evaluationId}`, { headers })
      .pipe(
        tap((evaluation) =>
          console.log(`Fetched evaluation ${evaluationId}`, evaluation),
        ),
        catchError(this.handleError('getEvaluationById')),
      );
  }

  /**
   * Create a new evaluation
   */
  createEvaluation(evaluation: CreateEvaluationDto): Observable<Evaluation> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Evaluation>(this.apiUrl, evaluation, { headers })
      .pipe(
        tap((newEvaluation) => {
          console.log('Created evaluation', newEvaluation);
          this.notificationService.success('Evaluation created successfully');
        }),
        catchError(this.handleError('createEvaluation')),
      );
  }

  /**
   * Update an evaluation
   */
  updateEvaluation(
    evaluationId: string,
    evaluation: UpdateEvaluationDto,
  ): Observable<Evaluation> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Evaluation>(`${this.apiUrl}/${evaluationId}`, evaluation, {
        headers,
      })
      .pipe(
        tap((updatedEvaluation) => {
          console.log(`Updated evaluation ${evaluationId}`, updatedEvaluation);
          this.notificationService.success('Evaluation updated successfully');
        }),
        catchError(this.handleError('updateEvaluation')),
      );
  }

  /**
   * Delete an evaluation
   */
  deleteEvaluation(evaluationId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/${evaluationId}`, { headers }).pipe(
      tap((_) => {
        console.log(`Deleted evaluation ${evaluationId}`);
        this.notificationService.success('Evaluation deleted successfully');
      }),
      catchError(this.handleError('deleteEvaluation')),
    );
  }

  /**
   * Get upcoming evaluations for a student
   */
  getUpcomingEvaluations(
    studentId: string,
    limit: number = 5,
  ): Observable<Evaluation[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Evaluation[]
      >(`${this.apiUrl}/upcoming/${studentId}?limit=${limit}`, { headers })
      .pipe(
        tap((evaluations) =>
          console.log(
            `Fetched upcoming evaluations for student ${studentId}`,
            evaluations,
          ),
        ),
        catchError(this.handleError('getUpcomingEvaluations')),
      );
  }

  /**
   * Get recent evaluations for a course
   */
  getRecentEvaluations(
    courseId: string,
    limit: number = 5,
  ): Observable<Evaluation[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Evaluation[]
      >(`${this.apiUrl}/recent/${courseId}?limit=${limit}`, { headers })
      .pipe(
        tap((evaluations) =>
          console.log(
            `Fetched recent evaluations for course ${courseId}`,
            evaluations,
          ),
        ),
        catchError(this.handleError('getRecentEvaluations')),
      );
  }

  /**
   * Get evaluations with grades for a student in a course
   */
  getEvaluationsWithGrades(
    courseId: string,
    studentId: string,
  ): Observable<Evaluation[]> {
    const headers = this.getAuthHeaders();
    return forkJoin({
      evaluations: this.getEvaluationsByCourse(courseId),
      grades: this.http.get<StudentGrade[]>(
        `${this.gradesUrl}/student/${studentId}/course/${courseId}`,
        { headers },
      ),
    }).pipe(
      map(({ evaluations, grades }) => {
        return evaluations.map((evaluation) => {
          const grade = grades.find((g) => g.evaluationId === evaluation._id);
          return {
            ...evaluation,
            studentGrade: grade ? grade.grade : null,
            gradeId: grade ? grade._id : null,
            comments: grade ? grade.comments : null,
          };
        });
      }),
      tap((evaluations) =>
        console.log(
          `Fetched evaluations with grades for student ${studentId} in course ${courseId}`,
          evaluations,
        ),
      ),
      catchError(this.handleError('getEvaluationsWithGrades')),
    );
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
