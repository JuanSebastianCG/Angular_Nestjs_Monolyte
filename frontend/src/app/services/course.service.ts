import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
}

interface Course {
  _id: string;
  name: string;
  description: string;
  professorId: string;
  schedule: Schedule;
}

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private endpoint = 'courses';

  constructor(private apiService: ApiService) {}

  // Get all courses
  getAllCourses(includePrerequisites: boolean = false): Observable<Course[]> {
    return this.apiService.get<Course[]>(this.endpoint, {
      includePrerequisites,
    });
  }

  // Get course by ID
  getCourseById(id: string): Observable<Course> {
    return this.apiService.get<Course>(`${this.endpoint}/${id}`);
  }

  // Create a new course
  createCourse(course: Omit<Course, '_id'>): Observable<Course> {
    return this.apiService.post<Course>(this.endpoint, course);
  }

  // Update course
  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    return this.apiService.patch<Course>(`${this.endpoint}/${id}`, course);
  }

  // Delete course
  deleteCourse(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  // Create a prerequisite relationship
  createPrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    return this.apiService.post<any>('prerequisites', {
      courseId,
      prerequisiteCourseId,
    });
  }

  // Get prerequisites for a course
  getPrerequisites(courseId: string): Observable<Course[]> {
    return this.apiService.get<Course[]>(`prerequisites/course/${courseId}`);
  }

  // Delete a prerequisite relationship
  deletePrerequisite(
    courseId: string,
    prerequisiteCourseId: string,
  ): Observable<any> {
    return this.apiService.delete<any>(
      `prerequisites/${courseId}/${prerequisiteCourseId}`,
    );
  }
}
