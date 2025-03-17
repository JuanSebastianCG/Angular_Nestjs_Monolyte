import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Course } from '../models/course.model';
import { Schedule } from '../models/schedule.model';
import { Prerequisite } from '../models/prerequisite.model';
import { map, catchError, tap } from 'rxjs/operators';
import { throwError } from 'rxjs';

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
   * Create a new course
   * Based on the API example:
   * POST /courses
   * {
   *   "name": "Course name",
   *   "description": "Course description",
   *   "professorId": "MongoDB ObjectId",
   *   "schedule": { days, times, etc. }
   * }
   */
  createCourse(
    name: string,
    description: string,
    professorId: string | string[] | null | undefined,
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

    // Ensure professorId is a string or null
    if (professorId) {
      // Array with values
      if (Array.isArray(professorId) && professorId.length > 0) {
        courseData.professorId = professorId[0];
      }
      // String with value
      else if (typeof professorId === 'string' && professorId.trim() !== '') {
        courseData.professorId = professorId;
      }
      // Otherwise don't set the professorId field at all
    }

    return this.http.post<Course>(this.apiUrl, courseData);
  }

  /**
   * Update a course
   * Based on the API example:
   * PATCH /courses/{id}
   * {
   *   "name": "Updated Name",
   *   "description": "Updated description",
   *   "professorId": "MongoDB ObjectId",
   *   "schedule": { updated schedule }
   * }
   */
  updateCourse(courseId: string, courseData: any): Observable<Course> {
    // Handle professorId properly
    if (courseData.professorId) {
      // If it's an array with values
      if (
        Array.isArray(courseData.professorId) &&
        courseData.professorId.length > 0
      ) {
        courseData.professorId = courseData.professorId[0];
      }
      // If it's an empty array or empty string, remove the property
      else if (
        (Array.isArray(courseData.professorId) &&
          courseData.professorId.length === 0) ||
        (typeof courseData.professorId === 'string' &&
          courseData.professorId.trim() === '')
      ) {
        delete courseData.professorId;
      }
      // Otherwise keep as is (it's a valid string)
    } else if (
      courseData.professorId === null ||
      courseData.professorId === undefined
    ) {
      // Explicitly set to null if that's what the API expects for removing a professor
      // Or just remove the property if the API doesn't accept null
      delete courseData.professorId;
    }

    return this.http
      .patch<Course>(`${this.apiUrl}/${courseId}`, courseData)
      .pipe(
        catchError((error) => {
          console.error('Error updating course:', error);

          // Handle specific error cases
          if (error.status === 400) {
            throw new Error(
              'Invalid course data: ' + (error.error?.message || 'Bad request'),
            );
          } else if (error.status === 404) {
            throw new Error('Course not found');
          } else if (error.status === 403) {
            throw new Error('You do not have permission to update this course');
          } else {
            throw new Error(
              'Failed to update course: ' +
                (error.error?.message || 'Server error'),
            );
          }
        }),
      );
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
    console.log(`Getting courses for professor with ID: ${professorId}`);
    return this.http.get<Course[]>(`${this.apiUrl}`, {
      params: { professorId },
    }).pipe(
      tap(courses => console.log(`Found ${courses.length} courses for professor ID ${professorId}`))
    );
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
