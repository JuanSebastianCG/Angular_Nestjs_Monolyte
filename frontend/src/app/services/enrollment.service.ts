import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Enrollment, EnrollmentStatus } from '../models/enrollment.model';

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all enrollments
   */
  getAllEnrollments(): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>('enrollments');
  }

  /**
   * Get enrollments by student
   */
  getEnrollmentsByStudent(studentId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(
      `enrollments/student/${studentId}`,
    );
  }

  /**
   * Get enrollments by course
   */
  getEnrollmentsByCourse(courseId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(`enrollments/course/${courseId}`);
  }

  /**
   * Get specific enrollment
   */
  getEnrollment(studentId: string, courseId: string): Observable<Enrollment> {
    return this.apiService.get<Enrollment>(
      `enrollments/${studentId}/${courseId}`,
    );
  }

  /**
   * Create a new enrollment
   */
  createEnrollment(
    studentId: string,
    courseId: string,
    enrollmentStartDate: string,
    enrollmentEndDate: string,
  ): Observable<Enrollment> {
    return this.apiService.post<Enrollment>('enrollments', {
      studentId,
      courseId,
      enrollmentStartDate,
      enrollmentEndDate,
    });
  }

  /**
   * Update enrollment status
   */
  updateEnrollmentStatus(
    studentId: string,
    courseId: string,
    status: EnrollmentStatus,
    completionDate?: string,
  ): Observable<Enrollment> {
    return this.apiService.patch<Enrollment>(
      `enrollments/${studentId}/${courseId}`,
      {
        status,
        completionDate,
      },
    );
  }

  /**
   * Delete enrollment
   */
  deleteEnrollment(studentId: string, courseId: string): Observable<any> {
    return this.apiService.delete<any>(`enrollments/${studentId}/${courseId}`);
  }

  /**
   * Get active enrollments for a student
   */
  getActiveEnrollments(studentId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(
      `enrollments/student/${studentId}/active`,
    );
  }

  /**
   * Get completed enrollments for a student
   */
  getCompletedEnrollments(studentId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(
      `enrollments/student/${studentId}/completed`,
    );
  }

  /**
   * Get enrollment statistics for a course
   */
  getEnrollmentStatsByCourse(courseId: string): Observable<{
    totalEnrollments: number;
    activeEnrollments: number;
    completedEnrollments: number;
  }> {
    return this.apiService.get<{
      totalEnrollments: number;
      activeEnrollments: number;
      completedEnrollments: number;
    }>(`enrollments/course/${courseId}/stats`);
  }

  /**
   * Get enrollment count by course and status
   */
  getEnrollmentCountByCourseAndStatus(
    courseId: string,
    status: EnrollmentStatus,
  ): Observable<number> {
    return this.apiService
      .get<{
        count: number;
      }>(`enrollments/course/${courseId}/count`, { status })
      .pipe(map((response) => response.count));
  }

  /**
   * Check if a student is enrolled in a course
   */
  isStudentEnrolled(studentId: string, courseId: string): Observable<boolean> {
    return this.apiService
      .get<{ enrolled: boolean }>(`enrollments/check/${studentId}/${courseId}`)
      .pipe(map((response) => response.enrolled));
  }
}
