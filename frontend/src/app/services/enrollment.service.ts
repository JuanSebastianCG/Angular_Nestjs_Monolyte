import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface Enrollment {
  _id: string;
  studentId: string;
  courseId: string;
  enrollmentStartDate: string;
  enrollmentEndDate: string;
  status: 'active' | 'completed' | 'dropped';
  completionDate?: string;
}

@Injectable({
  providedIn: 'root',
})
export class EnrollmentService {
  private endpoint = 'enrollments';

  constructor(private apiService: ApiService) {}

  // Get all enrollments
  getAllEnrollments(): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(this.endpoint);
  }

  // Get enrollments by student
  getEnrollmentsByStudent(studentId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(
      `${this.endpoint}/student/${studentId}`,
    );
  }

  // Get enrollments by course
  getEnrollmentsByCourse(courseId: string): Observable<Enrollment[]> {
    return this.apiService.get<Enrollment[]>(
      `${this.endpoint}/course/${courseId}`,
    );
  }

  // Get specific enrollment
  getEnrollment(studentId: string, courseId: string): Observable<Enrollment> {
    return this.apiService.get<Enrollment>(
      `${this.endpoint}/${studentId}/${courseId}`,
    );
  }

  // Create enrollment
  createEnrollment(
    enrollment: Omit<Enrollment, '_id'>,
  ): Observable<Enrollment> {
    return this.apiService.post<Enrollment>(this.endpoint, enrollment);
  }

  // Update enrollment
  updateEnrollment(
    studentId: string,
    courseId: string,
    data: Partial<Enrollment>,
  ): Observable<Enrollment> {
    return this.apiService.patch<Enrollment>(
      `${this.endpoint}/${studentId}/${courseId}`,
      data,
    );
  }

  // Delete enrollment
  deleteEnrollment(studentId: string, courseId: string): Observable<any> {
    return this.apiService.delete<any>(
      `${this.endpoint}/${studentId}/${courseId}`,
    );
  }
}
