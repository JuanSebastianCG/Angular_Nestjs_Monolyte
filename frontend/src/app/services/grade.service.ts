import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Grade {
  _id: string;
  courseId: string;
  examId: string;
  evaluationId?: string;
  studentId: string;
  value: number;
  feedback?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface GradeWithDetails extends Grade {
  examTitle?: string;
  evaluationName?: string;
  studentName?: string;
  courseName?: string;
  studentGrades?: StudentGrade[];
  expanded?: boolean;
}

export interface StudentGrade {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    username?: string;
    email?: string;
  };
  evaluationId: string;
  courseId: string;
  grade: number;
  comments?: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GradeService {
  private apiUrl = `${environment.apiUrl}/grades`;

  constructor(private http: HttpClient) { }

  // Obtener calificaciones por curso
  getGradesByCourse(courseId: string): Observable<GradeWithDetails[]> {
    console.log(`Obteniendo calificaciones para el curso: ${courseId}`);
    return this.http.get<any[]>(`${this.apiUrl}/course/${courseId}`)
      .pipe(
        map(grades => {
          console.log(`Se encontraron ${grades.length} calificaciones para el curso ${courseId}`);
          // Mapeamos para asegurar compatibilidad con la propiedad 'value'
          const mappedGrades = grades.map(grade => ({
            ...grade,
            value: grade.score || grade.value, // Usar score si existe, o value si ya existe
          }));
          return mappedGrades;
        }),
        catchError(error => {
          console.error('Error obteniendo calificaciones del curso:', error);
          return throwError(() => new Error('No se pudieron obtener las calificaciones. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Obtener calificaciones por examen
  getGradesByExam(examId: string): Observable<GradeWithDetails[]> {
    console.log(`Obteniendo calificaciones para el examen: ${examId}`);
    return this.http.get<any[]>(`${this.apiUrl}/exam/${examId}`)
      .pipe(
        map(grades => {
          console.log(`Se encontraron ${grades.length} calificaciones para el examen ${examId}`);
          // Mapeamos para asegurar compatibilidad con la propiedad 'value'
          const mappedGrades = grades.map(grade => ({
            ...grade,
            value: grade.score || grade.value,
          }));
          return mappedGrades;
        }),
        catchError(error => {
          console.error('Error obteniendo calificaciones del examen:', error);
          return throwError(() => new Error('No se pudieron obtener las calificaciones. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Obtener calificaciones por estudiante
  getGradesByStudent(studentId: string): Observable<GradeWithDetails[]> {
    console.log(`Obteniendo calificaciones para el estudiante: ${studentId}`);
    return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}`)
      .pipe(
        map(grades => {
          console.log(`Se encontraron ${grades.length} calificaciones para el estudiante ${studentId}`);
          // Mapeamos para asegurar compatibilidad con la propiedad 'value'
          const mappedGrades = grades.map(grade => ({
            ...grade,
            value: grade.score || grade.value,
          }));
          return mappedGrades;
        }),
        catchError(error => {
          console.error('Error obteniendo calificaciones del estudiante:', error);
          return throwError(() => new Error('No se pudieron obtener las calificaciones. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Obtener calificaciones de un estudiante en un curso específico
  getStudentGradesInCourse(studentId: string, courseId: string): Observable<GradeWithDetails[]> {
    console.log(`Obteniendo calificaciones del estudiante ${studentId} en el curso ${courseId}`);
    return this.http.get<any[]>(`${this.apiUrl}/student/${studentId}/course/${courseId}`)
      .pipe(
        map(grades => {
          console.log(`Se encontraron ${grades.length} calificaciones para el estudiante en este curso`);
          // Mapeamos para asegurar compatibilidad con la propiedad 'value'
          const mappedGrades = grades.map(grade => ({
            ...grade,
            value: grade.score || grade.value,
          }));
          return mappedGrades;
        }),
        catchError(error => {
          console.error('Error obteniendo calificaciones del estudiante en el curso:', error);
          return throwError(() => new Error('No se pudieron obtener las calificaciones. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Registrar una nueva calificación
  createGrade(grade: Partial<Grade>): Observable<Grade> {
    // Aseguramos que usamos 'value' si viene como 'score'
    const gradeCopy = {...grade};
    if ('score' in gradeCopy && !('value' in gradeCopy)) {
      gradeCopy.value = (gradeCopy as any).score;
      delete (gradeCopy as any).score;
    }
    
    return this.http.post<Grade>(this.apiUrl, gradeCopy)
      .pipe(
        catchError(error => {
          console.error('Error registrando calificación:', error);
          return throwError(() => new Error('No se pudo registrar la calificación. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Actualizar una calificación
  updateGrade(gradeId: string, grade: Partial<Grade>): Observable<Grade> {
    // Aseguramos que usamos 'value' si viene como 'score'
    const gradeCopy = {...grade};
    if ('score' in gradeCopy && !('value' in gradeCopy)) {
      gradeCopy.value = (gradeCopy as any).score;
      delete (gradeCopy as any).score;
    }
    
    return this.http.put<Grade>(`${this.apiUrl}/${gradeId}`, gradeCopy)
      .pipe(
        catchError(error => {
          console.error('Error actualizando calificación:', error);
          return throwError(() => new Error('No se pudo actualizar la calificación. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Eliminar una calificación
  deleteGrade(gradeId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${gradeId}`)
      .pipe(
        catchError(error => {
          console.error('Error eliminando calificación:', error);
          return throwError(() => new Error('No se pudo eliminar la calificación. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Calcular promedio de calificaciones para un estudiante en un curso
  calculateStudentAverage(studentId: string, courseId: string): Observable<number> {
    return this.getStudentGradesInCourse(studentId, courseId)
      .pipe(
        map(grades => {
          if (grades.length === 0) return 0;
          
          const sum = grades.reduce((total, grade) => total + grade.value, 0);
          return parseFloat((sum / grades.length).toFixed(1));
        })
      );
  }

  // Registrar calificaciones en masa (útil para calificar a todos los estudiantes de un examen)
  bulkCreateGrades(grades: Partial<Grade>[]): Observable<Grade[]> {
    // Aseguramos que usamos 'value' si viene como 'score' para cada calificación
    const gradesCopy = grades.map(grade => {
      const gradeCopy = {...grade};
      if ('score' in gradeCopy && !('value' in gradeCopy)) {
        gradeCopy.value = (gradeCopy as any).score;
        delete (gradeCopy as any).score;
      }
      return gradeCopy;
    });
    
    return this.http.post<Grade[]>(`${this.apiUrl}/bulk`, { grades: gradesCopy })
      .pipe(
        catchError(error => {
          console.error('Error registrando calificaciones en masa:', error);
          return throwError(() => new Error('No se pudieron registrar las calificaciones. Por favor, inténtelo de nuevo.'));
        })
      );
  }
}
