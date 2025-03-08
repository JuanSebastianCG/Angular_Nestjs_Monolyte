import { Injectable } from '@angular/core';
import { Observable, map, forkJoin } from 'rxjs';
import { ApiService } from './api.service';
import { StudentGrade } from '../models/student-grade.model';
import { EvaluationService } from './evaluation.service';
import { Evaluation } from '../models/evaluation.model';
import { Student } from '../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class StudentGradeService {
  constructor(
    private apiService: ApiService,
    private evaluationService: EvaluationService,
  ) {}

  /**
   * Get all student grades
   */
  getAllStudentGrades(): Observable<StudentGrade[]> {
    return this.apiService.get<StudentGrade[]>('student-grades');
  }

  /**
   * Get grades by student
   */
  getGradesByStudent(studentId: string): Observable<StudentGrade[]> {
    return this.apiService.get<StudentGrade[]>(
      `student-grades/student/${studentId}`,
    );
  }

  /**
   * Get grades by evaluation
   */
  getGradesByEvaluation(evaluationId: string): Observable<StudentGrade[]> {
    return this.apiService.get<StudentGrade[]>(
      `student-grades/evaluation/${evaluationId}`,
    );
  }

  /**
   * Get specific grade
   */
  getGrade(evaluationId: string, studentId: string): Observable<StudentGrade> {
    return this.apiService.get<StudentGrade>(
      `student-grades/${evaluationId}/${studentId}`,
    );
  }

  /**
   * Create a new student grade
   */
  createStudentGrade(
    studentId: string,
    evaluationId: string,
    grade: number,
    comments?: string,
  ): Observable<StudentGrade> {
    return this.apiService.post<StudentGrade>('student-grades', {
      studentId,
      evaluationId,
      grade,
      comments,
    });
  }

  /**
   * Update student grade
   */
  updateStudentGrade(
    evaluationId: string,
    studentId: string,
    grade: number,
    comments?: string,
  ): Observable<StudentGrade> {
    return this.apiService.patch<StudentGrade>(
      `student-grades/${evaluationId}/${studentId}`,
      {
        grade,
        comments,
      },
    );
  }

  /**
   * Delete student grade
   */
  deleteStudentGrade(evaluationId: string, studentId: string): Observable<any> {
    return this.apiService.delete<any>(
      `student-grades/${evaluationId}/${studentId}`,
    );
  }

  /**
   * Get student's total course grade
   * Calculates the weighted average of all evaluations in a course for a student
   */
  getStudentCourseGrade(
    studentId: string,
    courseId: string,
  ): Observable<{
    totalGrade: number;
    completedEvaluations: number;
    totalEvaluations: number;
    passStatus: 'passing' | 'failing' | 'incomplete';
  }> {
    return forkJoin({
      evaluations: this.evaluationService.getEvaluationsByCourse(courseId),
      studentGrades: this.getGradesByStudent(studentId),
    }).pipe(
      map(({ evaluations, studentGrades }) => {
        // Filter evaluations for this course
        const courseEvaluationIds = evaluations.map((e) => e._id);

        // Filter grades for these evaluations
        const relevantGrades = studentGrades.filter((grade) =>
          courseEvaluationIds.includes(grade.evaluationId._id),
        );

        const totalEvaluations = evaluations.length;
        const completedEvaluations = relevantGrades.length;

        if (completedEvaluations === 0) {
          return {
            totalGrade: 0,
            completedEvaluations: 0,
            totalEvaluations,
            passStatus: 'incomplete' as const,
          };
        }

        // Calculate total max score from all evaluations
        const totalMaxScore = evaluations.reduce(
          (sum, evaluation) => sum + evaluation.maxScore,
          0,
        );

        // Calculate student's total score
        const totalStudentScore = relevantGrades.reduce((sum, grade) => {
          const evaluation = evaluations.find(
            (e) => e._id === grade.evaluationId._id,
          );
          return sum + grade.grade;
        }, 0);

        // Calculate percentage
        const totalGrade = (totalStudentScore / totalMaxScore) * 100;

        // Determine pass/fail status (usually 60% is passing)
        const passStatus =
          totalGrade >= 60
            ? ('passing' as const)
            : completedEvaluations < totalEvaluations
              ? ('incomplete' as const)
              : ('failing' as const);

        return {
          totalGrade,
          completedEvaluations,
          totalEvaluations,
          passStatus,
        };
      }),
    );
  }

  /**
   * Get all grades for all students in a specific course evaluation
   */
  getAllGradesForCourseEvaluation(
    courseId: string,
    evaluationId: string,
  ): Observable<
    Array<{
      student: Student;
      grade: number;
      maxScore: number;
      percentage: number;
      comments?: string;
    }>
  > {
    return forkJoin({
      evaluation: this.evaluationService.getEvaluationById(evaluationId),
      grades: this.getGradesByEvaluation(evaluationId),
    }).pipe(
      map(({ evaluation, grades }) => {
        return grades.map((grade) => ({
          student: grade.studentId,
          grade: grade.grade,
          maxScore: evaluation.maxScore,
          percentage: (grade.grade / evaluation.maxScore) * 100,
          comments: grade.comments,
        }));
      }),
    );
  }

  /**
   * Get grade distribution for an evaluation
   * Returns counts of grades in different ranges
   */
  getGradeDistribution(evaluationId: string): Observable<{
    ranges: Array<{ min: number; max: number; count: number }>;
    totalStudents: number;
    averageGrade: number;
  }> {
    return this.getGradesByEvaluation(evaluationId).pipe(
      map((grades) => {
        // Define grade ranges (e.g., 0-59, 60-69, 70-79, 80-89, 90-100)
        const ranges = [
          { min: 0, max: 59, count: 0 },
          { min: 60, max: 69, count: 0 },
          { min: 70, max: 79, count: 0 },
          { min: 80, max: 89, count: 0 },
          { min: 90, max: 100, count: 0 },
        ];

        const totalStudents = grades.length;
        let totalGrade = 0;

        // Count grades in each range
        grades.forEach((grade) => {
          const percentage = (grade.grade / grade.evaluationId.maxScore) * 100;
          totalGrade += percentage;

          for (const range of ranges) {
            if (percentage >= range.min && percentage <= range.max) {
              range.count++;
              break;
            }
          }
        });

        const averageGrade = totalStudents > 0 ? totalGrade / totalStudents : 0;

        return {
          ranges,
          totalStudents,
          averageGrade,
        };
      }),
    );
  }

  /**
   * Get course performance across all evaluations
   */
  getCoursePerformanceOverview(courseId: string): Observable<{
    evaluations: Array<{
      name: string;
      averageGrade: number;
      maxScore: number;
    }>;
    overallAverage: number;
    studentCount: number;
    passingCount: number;
    failingCount: number;
  }> {
    return this.evaluationService.getEvaluationsByCourse(courseId).pipe(
      map((evaluations) => {
        // For simplicity, we're returning a placeholder implementation
        // In a real app, you would fetch grades for each evaluation and calculate stats
        return {
          evaluations: evaluations.map((evaluation) => ({
            name: evaluation.name,
            averageGrade: 0, // Placeholder
            maxScore: evaluation.maxScore,
          })),
          overallAverage: 0,
          studentCount: 0,
          passingCount: 0,
          failingCount: 0,
        };
      }),
    );
  }

  /**
   * Submit multiple grades at once for an evaluation
   */
  submitBulkGrades(
    evaluationId: string,
    grades: Array<{
      studentId: string;
      grade: number;
      comments?: string;
    }>,
  ): Observable<StudentGrade[]> {
    return this.apiService.post<StudentGrade[]>(
      `student-grades/bulk/${evaluationId}`,
      { grades },
    );
  }

  /**
   * Import grades from CSV
   * This is a placeholder method - in a real app, you'd implement file upload
   */
  importGradesFromCSV(
    evaluationId: string,
    fileData: any,
  ): Observable<{
    success: boolean;
    imported: number;
    errors: any[];
  }> {
    return this.apiService.post<{
      success: boolean;
      imported: number;
      errors: any[];
    }>(`student-grades/import/${evaluationId}`, fileData);
  }

  /**
   * Export grades to CSV format
   */
  exportGradesToCSV(evaluationId: string): Observable<{ csvContent: string }> {
    return this.apiService.get<{ csvContent: string }>(
      `student-grades/export/${evaluationId}`,
    );
  }
}
