import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, forkJoin, combineLatest } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Enrollment } from './enrollment.service';
import { Course } from '../models/course.model';
import { Prerequisite } from '../models/prerequisite.model';
import { Student } from '../models/student.model';
import { Schedule } from '../models/schedule.model';
import { NotificationService } from '../components/notification/notification.service';

export interface Student {
  _id: string;
  name: string;
  email: string;
  status?: string;
}

export interface CreateCourseDto {
  name: string;
  description: string;
  capacity: number;
  professorId: string;
  schedule?: {
    days: string[];
    startTime: string;
    endTime: string;
    room: string;
    startDate: string;
    endDate: string;
  };
}

export interface UpdateCourseDto {
  name?: string;
  description?: string;
  capacity?: number;
  professorId?: string;
  schedule?: {
    days?: string[];
    startTime?: string;
    endTime?: string;
    room?: string;
    startDate?: string;
    endDate?: string;
  };
}

export interface PrerequisiteDto {
  courseId: string;
  prerequisiteCourseId: string;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;
  private prerequisitesUrl = `${environment.apiUrl}/prerequisites`;
  private enrollmentsUrl = `${environment.apiUrl}/enrollments`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private notificationService: NotificationService,
  ) {}

  /**
   * Get all courses
   * @param includePrerequisites Whether to include prerequisites in the response
   */
  getAllCourses(includePrerequisites: boolean = false): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Course[]
      >(`${this.apiUrl}?includePrerequisites=${includePrerequisites}`, { headers })
      .pipe(
        tap((courses) => console.log(`Retrieved ${courses.length} courses`)),
        catchError(this.handleError('Failed to retrieve courses')),
      );
  }

  /**
   * Get courses by department ID
   * @param departmentId The ID of the department
   */
  getCoursesByDepartment(departmentId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/department/${departmentId}`, { headers })
      .pipe(
        tap((courses) =>
          console.log(
            `Retrieved ${courses.length} courses for department ${departmentId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve courses for department ${departmentId}`,
          ),
        ),
      );
  }

  /**
   * Get courses by professor ID
   * @param professorId The ID of the professor
   */
  getCoursesByProfessor(professorId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/professor/${professorId}`, { headers })
      .pipe(
        tap((courses) =>
          console.log(
            `Retrieved ${courses.length} courses for professor ${professorId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve courses for professor ${professorId}`,
          ),
        ),
      );
  }

  /**
   * Get courses by student ID (enrolled courses)
   * @param studentId The ID of the student
   */
  getCoursesByStudent(studentId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();

    // First, get enrollments for the student
    return this.http
      .get<any[]>(`${this.enrollmentsUrl}/student/${studentId}`, { headers })
      .pipe(
        map((enrollments) => {
          if (!enrollments || enrollments.length === 0) {
            return [];
          }

          // Map the enrollments to courses
          const courses = enrollments.map((enrollment) =>
            this.extractCourseFromEnrollment(enrollment),
          );
          return courses;
        }),
        tap((courses) =>
          console.log(
            `Retrieved ${courses.length} courses for student ${studentId}`,
          ),
        ),
        catchError((error) => {
          console.error('Error fetching student enrollments:', error);
          this.notificationService.error('Failed to retrieve enrolled courses');
          return of([]);
        }),
      );
  }

  /**
   * Extract course data from an enrollment object
   */
  private extractCourseFromEnrollment(enrollment: any): Course {
    // According to the API format, the full course data comes in the courseId field
    const courseData = enrollment.courseId;

    // If courseId contains the full course object (populated)
    if (courseData && typeof courseData === 'object' && courseData._id) {
      // Build a Course object with the embedded data
      const course: Course = {
        _id: courseData._id,
        name: courseData.name,
        description: courseData.description,
        capacity: courseData.capacity || 0,
        professorId: courseData.professorId,
        // Add any other properties available
        isEnrolled: true,
        enrollmentStatus: enrollment.status || 'active',
        enrollmentDate: enrollment.enrollmentStartDate,
      };

      return course;
    } else {
      // If course data is not embedded, return a minimal course object
      console.warn(
        `Enrollment ${enrollment._id} has courseId that is not an object:`,
        courseData,
      );
      return {
        _id: typeof courseData === 'string' ? courseData : enrollment.courseId,
        name: 'Unknown Course',
        description: 'Course details not available',
        capacity: 0,
        isEnrolled: true,
        enrollmentStatus: enrollment.status || 'active',
        enrollmentDate: enrollment.enrollmentStartDate,
      } as Course;
    }
  }

  /**
   * Get course by ID
   * @param id The ID of the course
   * @param includePrerequisites Whether to include prerequisites in the response
   */
  getCourseById(
    id: string,
    includePrerequisites: boolean = false,
  ): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course>(
        `${this.apiUrl}/${id}?includePrerequisites=${includePrerequisites}`,
        { headers },
      )
      .pipe(
        tap((course) => console.log(`Retrieved course: ${course.name}`)),
        catchError(this.handleError(`Failed to retrieve course ${id}`)),
      );
  }

  /**
   * Get multiple courses by IDs
   * @param ids Array of course IDs
   */
  getCoursesById(ids: string[]): Observable<Course[]> {
    if (!ids || ids.length === 0) {
      console.log('No course IDs provided to getCoursesById');
      return of([]);
    }

    console.log(`Fetching details for ${ids.length} courses with IDs:`, ids);
    const headers = this.getAuthHeaders();

    // Try to use an endpoint that accepts multiple IDs if available
    const idsParam = ids.join(',');

    return this.http
      .get<Course[]>(`${this.apiUrl}/byIds?ids=${idsParam}`, { headers })
      .pipe(
        catchError((error) => {
          console.log('Falling back to fetching courses individually');
          // Fallback: fetch each course individually
          const courseObservables = ids.map((id) =>
            this.getCourseById(id).pipe(
              catchError((error) => {
                console.error(`Error fetching course ${id}:`, error);
                return of(null);
              }),
            ),
          );

          return forkJoin(courseObservables).pipe(
            map(
              (courses) =>
                courses.filter((course) => course !== null) as Course[],
            ),
          );
        }),
        catchError(this.handleError('Failed to retrieve courses by IDs')),
      );
  }

  /**
   * Search courses by name
   * @param name Course name to search for
   */
  searchCoursesByName(name: string): Observable<Course[]> {
    if (!name || name.trim() === '') {
      return of([]);
    }

    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Course[]
      >(`${this.apiUrl}/search?name=${encodeURIComponent(name)}`, { headers })
      .pipe(
        tap((courses) =>
          console.log(`Found ${courses.length} courses matching "${name}"`),
        ),
        catchError(
          this.handleError(`Failed to search courses with name "${name}"`),
        ),
      );
  }

  /**
   * Get courses with available capacity
   */
  getCoursesWithAvailableCapacity(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.getAllCourses().pipe(
      map((courses) =>
        courses.filter((course) => {
          // Check if the course has capacity information
          if (typeof course.capacity === 'number') {
            // Get the enrolled students count if available
            const enrolledCount = course.enrolledStudents?.length || 0;
            return course.capacity > enrolledCount;
          }
          // If capacity info is not available, include the course by default
          return true;
        }),
      ),
      tap((courses) =>
        console.log(`Found ${courses.length} courses with available capacity`),
      ),
      catchError(
        this.handleError('Failed to filter courses with available capacity'),
      ),
    );
  }

  /**
   * Create a new course
   * @param course The course data to create
   */
  createCourse(course: CreateCourseDto): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http.post<Course>(this.apiUrl, course, { headers }).pipe(
      tap((newCourse) => {
        console.log(`Created course: ${newCourse.name}`);
        this.notificationService.success('Course created successfully');
      }),
      catchError(this.handleError('Failed to create course')),
    );
  }

  /**
   * Update an existing course
   * @param id The ID of the course to update
   * @param course The course data to update
   */
  updateCourse(id: string, course: UpdateCourseDto): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .patch<Course>(`${this.apiUrl}/${id}`, course, { headers })
      .pipe(
        tap((updatedCourse) => {
          console.log(`Updated course: ${updatedCourse.name}`);
          this.notificationService.success('Course updated successfully');
        }),
        catchError(this.handleError(`Failed to update course ${id}`)),
      );
  }

  /**
   * Delete a course
   * @param id The ID of the course to delete
   */
  deleteCourse(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { headers }).pipe(
      tap(() => {
        console.log(`Deleted course ${id}`);
        this.notificationService.success('Course deleted successfully');
      }),
      catchError(this.handleError(`Failed to delete course ${id}`)),
    );
  }

  /**
   * Get enrolled students for a course
   * @param courseId The ID of the course
   */
  getEnrolledStudents(courseId: string): Observable<Student[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Student[]>(`${this.enrollmentsUrl}/course/${courseId}`, { headers })
      .pipe(
        tap((students) =>
          console.log(
            `Retrieved ${students.length} enrolled students for course ${courseId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve enrolled students for course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Get course prerequisites
   * @param courseId The ID of the course
   */
  getCoursePrerequisites(courseId: string): Observable<Prerequisite[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<
        Prerequisite[]
      >(`${this.prerequisitesUrl}/course/${courseId}`, { headers })
      .pipe(
        map((prerequisites) => {
          if (!prerequisites) return [];

          // Ensure consistent format
          return prerequisites.map((prereq) => ({
            courseId:
              typeof prereq.courseId === 'object'
                ? prereq.courseId._id
                : prereq.courseId,
            name:
              typeof prereq.courseId === 'object'
                ? prereq.courseId.name
                : prereq.name || 'Unknown Course',
          }));
        }),
        tap((prerequisites) =>
          console.log(
            `Retrieved ${prerequisites.length} prerequisites for course ${courseId}`,
          ),
        ),
        catchError(
          this.handleError(
            `Failed to retrieve prerequisites for course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Add a prerequisite to a course
   * @param courseId The ID of the course
   * @param prerequisiteCourseId The ID of the prerequisite course
   */
  addCoursePrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    const prerequisite: PrerequisiteDto = {
      courseId,
      prerequisiteCourseId,
    };

    const headers = this.getAuthHeaders();
    return this.http
      .post<any>(this.prerequisitesUrl, prerequisite, { headers })
      .pipe(
        tap(() => {
          console.log(
            `Added prerequisite ${prerequisiteCourseId} to course ${courseId}`,
          );
          this.notificationService.success(
            'Course prerequisite added successfully',
          );
        }),
        catchError(
          this.handleError(`Failed to add prerequisite to course ${courseId}`),
        ),
      );
  }

  /**
   * Remove a prerequisite from a course
   * @param courseId The ID of the course
   * @param prerequisiteCourseId The ID of the prerequisite course
   */
  removeCoursePrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(
        `${this.prerequisitesUrl}/${courseId}/${prerequisiteCourseId}`,
        { headers },
      )
      .pipe(
        tap(() => {
          console.log(
            `Removed prerequisite ${prerequisiteCourseId} from course ${courseId}`,
          );
          this.notificationService.success(
            'Course prerequisite removed successfully',
          );
        }),
        catchError(
          this.handleError(
            `Failed to remove prerequisite from course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Enroll a student in a course
   * @param courseId The ID of the course
   * @param studentId The ID of the student
   */
  enrollStudentInCourse(courseId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();

    // Get current date
    const currentDate = new Date().toISOString().split('T')[0];
    // Calculate end date (6 months from now by default)
    const endDate = this.calculateEndDate();

    const enrollmentData = {
      studentId,
      courseId,
      enrollmentStartDate: currentDate,
      enrollmentEndDate: endDate,
      status: 'start', // Active enrollment
    };

    return this.http
      .post<any>(this.enrollmentsUrl, enrollmentData, { headers })
      .pipe(
        tap(() => {
          console.log(`Enrolled student ${studentId} in course ${courseId}`);
          this.notificationService.success('Successfully enrolled in course');
        }),
        catchError(
          this.handleError(
            `Failed to enroll student ${studentId} in course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Calculate an end date for enrollment (6 months from current date)
   */
  private calculateEndDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() + 6);
    return date.toISOString().split('T')[0];
  }

  /**
   * Unenroll a student from a course
   * @param courseId The ID of the course
   * @param studentId The ID of the student
   */
  unenrollStudentFromCourse(
    courseId: string,
    studentId: string,
  ): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.enrollmentsUrl}/${studentId}/${courseId}`, {
        headers,
      })
      .pipe(
        tap(() => {
          console.log(
            `Unenrolled student ${studentId} from course ${courseId}`,
          );
          this.notificationService.success(
            'Successfully unenrolled from course',
          );
        }),
        catchError(
          this.handleError(
            `Failed to unenroll student ${studentId} from course ${courseId}`,
          ),
        ),
      );
  }

  /**
   * Get enrollment status for a student in a course
   * @param courseId The ID of the course
   * @param studentId The ID of the student
   */
  getEnrollmentStatus(courseId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any>(`${this.enrollmentsUrl}/${studentId}/${courseId}`, { headers })
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return of({ isEnrolled: false });
          }
          return this.handleError(
            `Failed to get enrollment status for student ${studentId} in course ${courseId}`,
          )(error);
        }),
      );
  }

  /**
   * Get courses with their prerequisites
   */
  getCoursesWithPrerequisites(): Observable<Course[]> {
    return this.getAllCourses(true).pipe(
      tap((courses) =>
        console.log(`Retrieved ${courses.length} courses with prerequisites`),
      ),
      catchError(
        this.handleError('Failed to retrieve courses with prerequisites'),
      ),
    );
  }

  /**
   * Check if a student can enroll in a course (meets all prerequisites)
   * @param courseId The ID of the course
   * @param studentId The ID of the student
   */
  canStudentEnrollInCourse(
    courseId: string,
    studentId: string,
  ): Observable<{ canEnroll: boolean; missingPrerequisites: Prerequisite[] }> {
    // Step 1: Get course prerequisites
    return this.getCoursePrerequisites(courseId).pipe(
      switchMap((prerequisites) => {
        if (!prerequisites || prerequisites.length === 0) {
          // No prerequisites, student can enroll
          return of({ canEnroll: true, missingPrerequisites: [] });
        }

        // Step 2: Get student's enrolled courses
        return this.getCoursesByStudent(studentId).pipe(
          map((enrolledCourses) => {
            // Get IDs of enrolled courses
            const enrolledCourseIds = enrolledCourses.map(
              (course) => course._id,
            );

            // Check if all prerequisites are met
            const missingPrerequisites = prerequisites.filter(
              (prerequisite) =>
                !enrolledCourseIds.includes(prerequisite.courseId),
            );

            return {
              canEnroll: missingPrerequisites.length === 0,
              missingPrerequisites,
            };
          }),
        );
      }),
      catchError((error) => {
        console.error('Error checking enrollment eligibility:', error);
        this.notificationService.error(
          'Failed to check enrollment eligibility',
        );
        return of({ canEnroll: false, missingPrerequisites: [] });
      }),
    );
  }

  /**
   * Get course schedule conflicts for a student
   * @param courseId The ID of the course to check
   * @param studentId The ID of the student
   */
  getCourseScheduleConflicts(
    courseId: string,
    studentId: string,
  ): Observable<{ hasConflicts: boolean; conflictingCourses: Course[] }> {
    // Step 1: Get the schedule of the target course
    return this.getCourseById(courseId).pipe(
      switchMap((course) => {
        if (!course.schedule) {
          // No schedule, no conflicts
          return of({ hasConflicts: false, conflictingCourses: [] });
        }

        // Step 2: Get student's enrolled courses
        return this.getCoursesByStudent(studentId).pipe(
          map((enrolledCourses) => {
            // Filter courses with schedules
            const coursesWithSchedules = enrolledCourses.filter(
              (c) => c.schedule,
            );

            // Check for conflicts
            const conflictingCourses = coursesWithSchedules.filter(
              (enrolledCourse) =>
                this.hasScheduleConflict(
                  course.schedule!,
                  enrolledCourse.schedule!,
                ),
            );

            return {
              hasConflicts: conflictingCourses.length > 0,
              conflictingCourses,
            };
          }),
        );
      }),
      catchError((error) => {
        console.error('Error checking schedule conflicts:', error);
        this.notificationService.error('Failed to check schedule conflicts');
        return of({ hasConflicts: false, conflictingCourses: [] });
      }),
    );
  }

  /**
   * Check if two schedules conflict
   * @param schedule1 First schedule
   * @param schedule2 Second schedule
   */
  private hasScheduleConflict(
    schedule1: Schedule,
    schedule2: Schedule,
  ): boolean {
    // Check if date ranges overlap
    const start1 = new Date(schedule1.startDate);
    const end1 = new Date(schedule1.endDate);
    const start2 = new Date(schedule2.startDate);
    const end2 = new Date(schedule2.endDate);

    // If date ranges don't overlap, no conflict
    if (end1 < start2 || end2 < start1) {
      return false;
    }

    // Check if days overlap
    const commonDays = schedule1.days.filter((day) =>
      schedule2.days.includes(day),
    );
    if (commonDays.length === 0) {
      return false;
    }

    // Check if time ranges overlap
    const [hours1Start, minutes1Start] = schedule1.startTime
      .split(':')
      .map(Number);
    const [hours1End, minutes1End] = schedule1.endTime.split(':').map(Number);
    const [hours2Start, minutes2Start] = schedule2.startTime
      .split(':')
      .map(Number);
    const [hours2End, minutes2End] = schedule2.endTime.split(':').map(Number);

    const start1Minutes = hours1Start * 60 + minutes1Start;
    const end1Minutes = hours1End * 60 + minutes1End;
    const start2Minutes = hours2Start * 60 + minutes2Start;
    const end2Minutes = hours2End * 60 + minutes2End;

    // If time ranges don't overlap, no conflict
    return !(end1Minutes <= start2Minutes || end2Minutes <= start1Minutes);
  }

  /**
   * Generate headers with authentication token
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  /**
   * Error handler function
   * @param operation Description of the operation that failed
   */
  private handleError(operation: string) {
    return (error: any): Observable<never> => {
      console.error(`${operation}:`, error);
      if (error.status === 401) {
        this.notificationService.error(
          'Your session has expired. Please log in again.',
        );
        this.authService.logout();
      } else {
        this.notificationService.error(
          `${operation}: ${error.error?.message || error.message || 'Unknown error'}`,
        );
      }
      return throwError(() => error);
    };
  }
}
