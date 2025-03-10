import { Injectable } from '@angular/core';
import { Observable, map, forkJoin, of } from 'rxjs';
import { ApiService } from './api.service';
import {
  StudentGrade,
  isEvaluationObject,
  isStudentObject,
  getEvaluationId,
  getStudentId,
} from '../models/student-grade.model';
import { EvaluationService } from './evaluation.service';
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
   * Create a student grade
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
   * Update a student grade
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
   * Delete a student grade
   */
  deleteStudentGrade(evaluationId: string, studentId: string): Observable<any> {
    return this.apiService.delete(
      `student-grades/${evaluationId}/${studentId}`,
    );
  }

  /**
   * Get student's grade for a course
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
        // Get IDs of evaluations for this course
        const courseEvaluationIds = evaluations.map((e) => e._id);

        // Filter grades for these evaluations
        const relevantGrades = studentGrades.filter((grade) => {
          const evalId = isEvaluationObject(grade.evaluationId)
            ? grade.evaluationId._id
            : grade.evaluationId;
          return courseEvaluationIds.includes(evalId);
        });

        const totalEvaluations = evaluations.length;
        const completedEvaluations = relevantGrades.length;

        if (completedEvaluations === 0) {
          return {
            totalGrade: 0,
            completedEvaluations: 0,
            totalEvaluations,
            passStatus: 'incomplete',
          };
        }

        // Calculate total score based on completed evaluations
        const totalStudentScore = relevantGrades.reduce((sum, grade) => {
          const evalId = isEvaluationObject(grade.evaluationId)
            ? grade.evaluationId._id
            : grade.evaluationId;

          const evaluation = evaluations.find((e) => e._id === evalId);
          return sum + grade.grade;
        }, 0);

        // Calculate average
        const totalPossibleScore = relevantGrades.reduce((sum, grade) => {
          const evalId = isEvaluationObject(grade.evaluationId)
            ? grade.evaluationId._id
            : grade.evaluationId;

          const evaluation = evaluations.find((e) => e._id === evalId);
          return sum + (evaluation?.maxScore || 100); // Default to 100 if not found
        }, 0);

        const totalGrade = (totalStudentScore / totalPossibleScore) * 100;

        // Determine if passing (>= 60%)
        const passStatus =
          completedEvaluations < totalEvaluations
            ? 'incomplete'
            : totalGrade >= 60
              ? 'passing'
              : 'failing';

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
   * Get all grades for a specific evaluation with student info
   */
  getAllGradesForCourseEvaluation(
    courseId: string,
    evaluationId: string,
  ): Observable<
    Array<{
      student: any; // Changed from Student to any to avoid type conflicts
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
        if (!evaluation) return [];

        return grades.map((grade) => {
          const student = isStudentObject(grade.studentId)
            ? grade.studentId
            : grade.studentId;

          const maxScore = evaluation.maxScore;
          const percentage = (grade.grade / maxScore) * 100;

          return {
            student,
            grade: grade.grade,
            maxScore,
            percentage,
            comments: grade.comments,
          };
        });
      }),
    );
  }

  /**
   * Get grade distribution for an evaluation
   */
  getGradeDistribution(evaluationId: string): Observable<{
    ranges: Array<{ min: number; max: number; count: number }>;
    totalStudents: number;
    averageGrade: number;
  }> {
    return forkJoin({
      evaluation: this.evaluationService.getEvaluationById(evaluationId),
      grades: this.getGradesByEvaluation(evaluationId),
    }).pipe(
      map(({ evaluation, grades }) => {
        if (!evaluation || !grades.length) {
          return {
            ranges: [],
            totalStudents: 0,
            averageGrade: 0,
          };
        }

        // Define grade ranges (0-9, 10-19, ..., 90-100)
        const ranges = [
          { min: 0, max: 9, count: 0 },
          { min: 10, max: 19, count: 0 },
          { min: 20, max: 29, count: 0 },
          { min: 30, max: 39, count: 0 },
          { min: 40, max: 49, count: 0 },
          { min: 50, max: 59, count: 0 },
          { min: 60, max: 69, count: 0 },
          { min: 70, max: 79, count: 0 },
          { min: 80, max: 89, count: 0 },
          { min: 90, max: 100, count: 0 },
        ];

        let totalGrade = 0;

        // Count grades in each range
        grades.forEach((grade) => {
          // Handle union type - get maxScore safely
          const maxScore = isEvaluationObject(grade.evaluationId)
            ? grade.evaluationId.maxScore
            : 100; // Default to 100 if string

          const percentage = (grade.grade / maxScore) * 100;
          totalGrade += percentage;

          for (const range of ranges) {
            if (percentage >= range.min && percentage <= range.max) {
              range.count++;
              break;
            }
          }
        });

        const totalStudents = grades.length;
        const averageGrade = totalGrade / totalStudents;

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

  /* this will return a json of the exams with the califications of that course */
  getAllGradesForAllEvaluationsInCourse(courseId: string): Observable<any> {
    return this.evaluationService.getEvaluationsByCourse(courseId).pipe(
      map((evaluations) => {
        return evaluations.map((evaluation) => {
          if (!evaluation._id) return of([]);
          return this.getGradesByEvaluation(evaluation._id);
        });
      }),
    );
  }
}
