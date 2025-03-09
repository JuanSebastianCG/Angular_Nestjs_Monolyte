import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Course } from '../models/course.model';
import { Schedule } from '../models/schedule.model';
import { Prerequisite } from '../models/prerequisite.model';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(private http: HttpClient) {}

  /**
   * Get all courses
   */
  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  /**
   * Get course by ID
   */
  getCourse(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new course with inline schedule
   * Based on the API example:
   * POST /courses
   * {
   *   "name": "Course Name",
   *   "description": "Description",
   *   "professorId": "id",
   *   "schedule": { days, times, etc. }
   * }
   */
  createCourse(
    name: string,
    description: string,
    professorId: string | null,
    schedule: {
      days: string[];
      startTime: string;
      endTime: string;
      room: string;
      startDate: string;
      endDate: string;
    },
  ): Observable<Course> {
    // Build the request body according to the API format
    const courseData: any = {
      name,
      description,
      schedule,
    };

    // Only include professorId if it's provided and not null/empty
    if (professorId) {
      courseData.professorId = professorId;
    }

    return this.http.post<Course>(this.apiUrl, courseData);
  }

  /**
   * Update a course
   * Based on the API example:
   * PATCH /courses/{id}
   * {
   *   "name": "Updated Name",
   *   "schedule": { updated schedule }
   * }
   */
  updateCourse(courseId: string, courseData: any): Observable<Course> {
    return this.http.patch<Course>(`${this.apiUrl}/${courseId}`, courseData);
  }

  /**
   * Delete a course
   */
  deleteCourse(courseId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${courseId}`);
  }

  /**
   * Search courses by name - performs client-side filtering
   */
  searchCourses(query: string): Observable<Course[]> {
    // Get all courses and filter them locally
    return this.getAllCourses().pipe(
      map((courses: Course[]) => {
        if (!query) return courses;

        // Filter by name using case-insensitive matching
        return courses.filter((course) =>
          course.name.toLowerCase().includes(query.toLowerCase()),
        );
      }),
    );
  }

  /**
   * Get courses by professor ID
   */
  getCoursesByProfessor(professorId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}`, {
      params: { professorId },
    });
  }

  /**
   * Get courses by department ID
   */
  getCoursesByDepartment(departmentId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}`, {
      params: { departmentId },
    });
  }

  /**
   * Add a prerequisite to a course
   */
  addPrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${courseId}/prerequisites`, {
      prerequisiteCourseId,
    });
  }

  /**
   * Remove a prerequisite from a course
   */
  removePrerequisite(
    courseId: string,
    prerequisiteId: string,
  ): Observable<any> {
    return this.http.delete<any>(
      `${this.apiUrl}/${courseId}/prerequisites/${prerequisiteId}`,
    );
  }

  /**
   * Get courses with their prerequisites
   */
  getCoursesWithPrerequisites(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl, {
      params: { includePrerequisites: true },
    });
  }

  /**
   * Get courses that the student is not enrolled in
   */
  getAvailableCoursesForStudent(studentId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/available/${studentId}`);
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
    return this.http.get<{
      enrollmentsCount: number;
      averageGrade: number;
      passRate: number;
      evaluationsCount: number;
    }>(`${this.apiUrl}/${courseId}/statistics`);
  }

  /**
   * Get courses by schedule day
   */
  getCoursesByDay(day: string): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl, { params: { day } });
  }
}
