import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError, forkJoin } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { Enrollment } from './enrollment.service';
import { Course } from '../models/course.model';
import { Prerequisite } from '../models/prerequisite.model';
import { Student } from '../models/student.model';
import { Schedule } from '../models/schedule.model';

@Injectable({
  providedIn: 'root',
})
export class CourseService {
  private apiUrl = `${environment.apiUrl}/courses`;

  constructor(
    private http: HttpClient,
    private authService: AuthService,
  ) {}

  // Get all courses
  getAllCourses(): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(this.apiUrl, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get courses by department ID
  getCoursesByDepartment(departmentId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/department/${departmentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get courses by professor ID
  getCoursesByProfessor(professorId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course[]>(`${this.apiUrl}/professor/${professorId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get courses by student ID (enrolled courses)
  getCoursesByStudent(studentId: string): Observable<Course[]> {
    const headers = this.getAuthHeaders();
    
    console.log(`Fetching enrollments for student: ${studentId}`);
    
    // Obtener las inscripciones del estudiante desde el endpoint correcto
    return this.http
      .get<any[]>(`${environment.apiUrl}/enrollments/student/${studentId}`, { headers })
      .pipe(
        map(enrollments => {
          // Si no hay inscripciones, devolver array vacío
          if (!enrollments || enrollments.length === 0) {
            console.log('No enrollments found for student:', studentId);
            return [];
          }
          
          console.log(`Found ${enrollments.length} enrollments for student: ${studentId}`);
          
          // Extraer y transformar los cursos directamente desde las inscripciones
          // Según el formato que mostraste, el curso completo viene en el campo 'courseId'
          return enrollments.map(enrollment => {
            // Verificar si el curso está embebido en el objeto enrollment.courseId
            const courseData = enrollment.courseId;
            
            // Si el curso es un objeto completo (no solo un ID)
            if (courseData && typeof courseData === 'object' && courseData._id) {
              // Construir un objeto Course con los datos embebidos
              const course: Course = {
                _id: courseData._id,
                name: courseData.name,
                description: courseData.description,
                capacity: courseData.capacity || 0,
                professorId: courseData.professorId,
                // Datos adicionales de inscripción
                isEnrolled: true,
                enrollmentStatus: enrollment.status,
                enrollmentDate: new Date(enrollment.enrollmentStartDate).toISOString().split('T')[0]
              };
              
              return course;
            } else {
              // Si por alguna razón el curso no está embebido, usar el courseId como fallback
              console.warn(`Enrollment ${enrollment._id} has courseId that is not an object:`, courseData);
              return {
                _id: typeof courseData === 'string' ? courseData : enrollment.courseId,
                name: 'Curso desconocido',
                description: 'No se pudieron obtener los detalles del curso',
                professorId: '',
                isEnrolled: true,
                enrollmentStatus: enrollment.status
              } as Course;
            }
          });
        }),
        catchError(error => {
          console.error('Error fetching student enrollments:', error);
          return of([]);
        })
      );
  }

  // Get course by ID
  getCourseById(id: string): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<Course>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get multiple courses by IDs
  getCoursesById(ids: string[]): Observable<Course[]> {
    if (!ids || ids.length === 0) {
      console.log('No course IDs provided to getCoursesById');
      return of([]);
    }

    console.log(`Fetching details for ${ids.length} courses with IDs:`, ids);
    const headers = this.getAuthHeaders();
    
    // Join the ids with commas for a query parameter
    const idsParam = ids.join(',');
    
    return this.http
      .get<Course[]>(`${this.apiUrl}/byIds?ids=${idsParam}`, { headers })
      .pipe(
        catchError(error => {
          console.error('Error using /byIds endpoint:', error);
          console.log('Falling back to fetching courses individually');
          
          // Si el endpoint /byIds falla, intentamos obtener los cursos uno por uno
          const courseObservables = ids.map(id => 
            this.getCourseById(id).pipe(
              catchError(error => {
                console.error(`Error fetching course ${id}:`, error);
                return of(null);
              })
            )
          );
          
          return forkJoin(courseObservables).pipe(
            map(courses => courses.filter(course => course !== null) as Course[])
          );
        })
      );
  }

  // Create a new course
  createCourse(course: Partial<Course>): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .post<Course>(this.apiUrl, course, { headers })
      .pipe(catchError(this.handleError));
  }

  // Update a course
  updateCourse(id: string, course: Partial<Course>): Observable<Course> {
    const headers = this.getAuthHeaders();
    return this.http
      .put<Course>(`${this.apiUrl}/${id}`, course, { headers })
      .pipe(catchError(this.handleError));
  }

  // Delete a course
  deleteCourse(id: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrolled students in a course
  getEnrolledStudents(courseId: string): Observable<Student[]> {
    return this.http.get<Student[]>(`${this.apiUrl}/${courseId}/students`);
  }

  // Get prerequisites for a course
  getCoursePrerequisites(courseId: string): Observable<Prerequisite[]> {
    // En lugar de hacer una llamada a un endpoint que devuelve 404, obtenemos los detalles del curso
    // que ya incluyen sus prerrequisitos
    return this.getCourseById(courseId).pipe(
      map(course => {
        // Si el curso tiene la propiedad prerequisites, la devolvemos
        // sino devolvemos un array vacío
        if (course && course.prerequisites) {
          return course.prerequisites as Prerequisite[];
        }
        return [] as Prerequisite[];
      }),
      catchError(error => {
        console.error(`Error obteniendo prerrequisitos del curso ${courseId}:`, error);
        return of([] as Prerequisite[]);
      })
    );
  }

  // Enroll student in a course
  enrollStudentInCourse(courseId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4); // 4 months from now

    const enrollmentData: Enrollment = {
      studentId: studentId,
      courseId: courseId,
      enrollmentStartDate: today.toISOString().split('T')[0],
      enrollmentEndDate: endDate.toISOString().split('T')[0],
      status: 'start'
    };

    // Use the enrollments endpoint instead of the course endpoint
    return this.http
      .post<any>(`${environment.apiUrl}/enrollments`, enrollmentData, { headers })
      .pipe(catchError(this.handleError));
  }

  // Unenroll student from a course
  unenrollStudentFromCourse(courseId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .delete<any>(`${this.apiUrl}/${courseId}/enroll/${studentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get enrollment status for a student in a course
  getEnrollmentStatus(courseId: string, studentId: string): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http
      .get<any>(`${this.apiUrl}/${courseId}/enrollment/${studentId}`, { headers })
      .pipe(catchError(this.handleError));
  }

  // Get auth headers
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  // Error handler
  private handleError(error: any) {
    console.error('An error occurred in CourseService', error);
    return throwError(() => error);
  }
}
