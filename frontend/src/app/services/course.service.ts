import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';
import { Course, CourseJustId } from '../models/course.model';
import { Schedule } from '../models/schedule.model';
import { Prerequisite } from '../models/prerequisite.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all courses
   * @param includePrerequisites Whether to include prerequisites in the response
   */
  getAllCourses(includePrerequisites: boolean = false): Observable<Course[]> {
    return this.apiService.get<Course[]>('courses', { includePrerequisites });
  }

  /**
   * Get course by ID
   */
  getCourseById(courseId: string): Observable<Course> {
    return this.apiService.get<Course>(`courses/${courseId}`);
  }

  /**
   * Create a new course with inline schedule
   */
  createCourse(
    name: string,
    description: string,
    professorId: string,
    schedule: Partial<Schedule>,
    departmentId?: string,
  ): Observable<Course> {
    const courseData = {
      name,
      description,
      professorId,
      schedule,
      departmentId,
    };
    return this.apiService.post<Course>('courses', courseData);
  }

  /**
   * Update course
   */
  updateCourse(
    courseId: string,
    courseData: Partial<Course>,
  ): Observable<Course> {
    return this.apiService.patch<Course>(`courses/${courseId}`, courseData);
  }

  /**
   * Delete course
   */
  deleteCourse(courseId: string): Observable<any> {
    return this.apiService.delete<any>(`courses/${courseId}`);
  }

  /**
   * Search courses by name or description
   */
  searchCourses(query: string): Observable<Course[]> {
    return this.apiService.get<Course[]>('courses/search', { query });
  }

  /**
   * Get courses by professor
   */
  getCoursesByProfessor(professorId: string): Observable<Course[]> {
    return this.apiService.get<Course[]>(`courses/professor/${professorId}`);
  }

  /**
   * Get courses by department
   */
  getCoursesByDepartment(departmentId: string): Observable<Course[]> {
    return this.apiService.get<Course[]>(`courses/department/${departmentId}`);
  }

  /**
   * Add a prerequisite to a course
   */
  addPrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<Prerequisite> {
    return this.apiService.post<Prerequisite>('prerequisites', {
      courseId,
      prerequisiteCourseId,
    });
  }

  /**
   * Get prerequisites for a course
   */
  getPrerequisitesForCourse(courseId: string): Observable<Prerequisite[]> {
    return this.apiService.get<Prerequisite[]>(
      `prerequisites/course/${courseId}`,
    );
  }

  /**
   * Remove a prerequisite from a course
   */
  removePrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    return this.apiService.delete<any>(
      `prerequisites/${courseId}/${prerequisiteCourseId}`,
    );
  }

  /**
   * Get courses with their prerequisites
   */
  getCoursesWithPrerequisites(): Observable<Course[]> {
    return this.apiService.get<Course[]>('courses', {
      includePrerequisites: true,
    });
  }

  /**
   * Get courses that the student is not enrolled in
   */
  getAvailableCoursesForStudent(studentId: string): Observable<Course[]> {
    return this.apiService.get<Course[]>(`courses/available/${studentId}`);
  }

  /**
   * Get course statistics (enrollments count, average grade, etc.)
   */
  getCourseStatistics(courseId: string): Observable<{
    enrollmentsCount: number;
    averageGrade: number;
    passRate: number;
    evaluationsCount: number;
  }> {
    return this.apiService.get<{
      enrollmentsCount: number;
      averageGrade: number;
      passRate: number;
      evaluationsCount: number;
    }>(`courses/${courseId}/statistics`);
  }

  /**
   * Get courses by schedule day
   */
  getCoursesByDay(day: string): Observable<Course[]> {
    return this.apiService.get<Course[]>('courses', { day });
  }
}
