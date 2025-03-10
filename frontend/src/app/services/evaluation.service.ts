import { Injectable } from '@angular/core';
import { Observable, map, forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { Evaluation, EvaluationJustId } from '../models/evaluation.model';
import {
  StudentGrade,
  isEvaluationObject,
} from '../models/student-grade.model';

@Injectable({
  providedIn: 'root',
})
export class EvaluationService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all evaluations
   */
  getAllEvaluations(): Observable<Evaluation[]> {
    return this.apiService.get<Evaluation[]>('evaluations');
  }

  /**
   * Get evaluations by course
   */
  getEvaluationsByCourse(courseId: string): Observable<Evaluation[]> {
    return this.apiService.get<Evaluation[]>(`evaluations/course/${courseId}`);
  }

  /**
   * Get evaluation by ID
   */
  getEvaluationById(evaluationId: string): Observable<Evaluation> {
    return this.apiService.get<Evaluation>(`evaluations/${evaluationId}`);
  }

  /**
   * Create a new evaluation
   */
  createEvaluation(
    courseId: string,
    name: string,
    description: string,
    maxScore: number,
    evaluationDate: string,
  ): Observable<Evaluation> {
    return this.apiService.post<Evaluation>('evaluations', {
      courseId,
      name,
      description,
      maxScore,
      evaluationDate,
    });
  }

  /**
   * Update evaluation
   */
  updateEvaluation(
    evaluationId: string,
    evaluationData: Partial<Evaluation>,
  ): Observable<Evaluation> {
    return this.apiService.patch<Evaluation>(
      `evaluations/${evaluationId}`,
      evaluationData,
    );
  }

  /**
   * Delete evaluation
   */
  deleteEvaluation(evaluationId: string): Observable<any> {
    return this.apiService.delete<any>(`evaluations/${evaluationId}`);
  }

  /**
   * Get upcoming evaluations (evaluations with dates in the future)
   */
  getUpcomingEvaluations(): Observable<Evaluation[]> {
    return this.apiService.get<Evaluation[]>('evaluations/upcoming');
  }

  /**
   * Get upcoming evaluations for a specific course
   */
  getUpcomingEvaluationsForCourse(courseId: string): Observable<Evaluation[]> {
    return this.apiService.get<Evaluation[]>(
      `evaluations/upcoming/course/${courseId}`,
    );
  }

  /**
   * Get all grades for a specific evaluation
   */
  getGradesByEvaluation(evaluationId: string): Observable<StudentGrade[]> {
    return this.apiService.get<StudentGrade[]>(
      `student-grades/evaluation/${evaluationId}`,
    );
  }

  /**
   * Get grade statistics for an evaluation
   */
  getGradeStatisticsForEvaluation(evaluationId: string): Observable<{
    averageGrade: number;
    maxGrade: number;
    minGrade: number;
    passCount: number;
    failCount: number;
    totalCount: number;
    passRate: number;
  }> {
    return this.apiService
      .get<StudentGrade[]>(`student-grades/evaluation/${evaluationId}`)
      .pipe(
        map((grades) => {
          if (!grades || grades.length === 0) {
            return {
              averageGrade: 0,
              maxGrade: 0,
              minGrade: 0,
              passCount: 0,
              failCount: 0,
              totalCount: 0,
              passRate: 0,
            };
          }

          // Calculate statistics
          const totalCount = grades.length;
          const sum = grades.reduce((acc, grade) => acc + grade.grade, 0);
          const averageGrade = sum / totalCount;
          const maxGrade = Math.max(...grades.map((grade) => grade.grade));
          const minGrade = Math.min(...grades.map((grade) => grade.grade));

          // Assuming passing grade is 60% of max score
          const evaluation = grades[0].evaluationId;
          // Safely access maxScore using type guard
          const maxScore = isEvaluationObject(evaluation)
            ? evaluation.maxScore
            : 100;
          const passingThreshold = maxScore * 0.6;
          const passCount = grades.filter(
            (grade) => grade.grade >= passingThreshold,
          ).length;
          const failCount = totalCount - passCount;
          const passRate = (passCount / totalCount) * 100;

          return {
            averageGrade,
            maxGrade,
            minGrade,
            passCount,
            failCount,
            totalCount,
            passRate,
          };
        }),
      );
  }

  /**
   * Get evaluations with grades for a specific student and course
   */
  getEvaluationsWithGradesForStudentInCourse(
    studentId: string,
    courseId: string,
  ): Observable<Array<Evaluation & { grade?: number; comments?: string }>> {
    return forkJoin({
      evaluations: this.getEvaluationsByCourse(courseId),
      grades: this.apiService.get<StudentGrade[]>(
        `student-grades/student/${studentId}`,
      ),
    }).pipe(
      map(({ evaluations, grades }) => {
        return evaluations.map((evaluation) => {
          // Safely find matching grade with type guard
          const gradeInfo = grades.find((g) => {
            if (isEvaluationObject(g.evaluationId)) {
              return g.evaluationId._id === evaluation._id;
            }
            return g.evaluationId === evaluation._id;
          });

          return {
            ...evaluation,
            grade: gradeInfo ? gradeInfo.grade : undefined,
            comments: gradeInfo ? gradeInfo.comments : undefined,
          };
        });
      }),
    );
  }

  /**
   * Get course evaluation performance summary
   */
  getCourseEvaluationSummary(courseId: string): Observable<{
    evaluationCount: number;
    averageScore: number;
    nextEvaluation?: Evaluation;
  }> {
    return forkJoin({
      evaluations: this.getEvaluationsByCourse(courseId),
      upcoming: this.getUpcomingEvaluationsForCourse(courseId),
    }).pipe(
      map(({ evaluations, upcoming }) => {
        // Calculate statistics
        const evaluationCount = evaluations.length;

        // Calculate average grade for all evaluations that have an ID
        const gradesPromises = evaluations
          .filter((evaluation) => !!evaluation._id)
          .map((evaluation) =>
            this.getGradeStatisticsForEvaluation(evaluation._id as string),
          );

        // If no evaluations, return empty summary
        if (evaluationCount === 0) {
          return {
            evaluationCount: 0,
            averageScore: 0,
            nextEvaluation: undefined,
          };
        }

        // For simplicity in this example, we're returning basic info
        // In a real implementation, you would use forkJoin again to get all grade statistics
        return {
          evaluationCount,
          averageScore: 0, // This would be calculated from all grades
          nextEvaluation: upcoming.length > 0 ? upcoming[0] : undefined,
        };
      }),
    );
  }
}
