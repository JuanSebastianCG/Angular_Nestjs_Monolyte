import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Exam {
  _id: string;
  courseId: string;
  title: string;
  description?: string;
  date: string;
  maxScore: number;
  status: 'draft' | 'published' | 'completed';
  questions?: ExamQuestion[];
  duration?: number; // en minutos
  createdAt?: string;
  updatedAt?: string;
}

export interface ExamQuestion {
  _id: string;
  text: string;
  options?: string[];
  correctAnswer?: string;
  points: number;
  type: 'multiple_choice' | 'text' | 'true_false';
}

export interface GradeSubmission {
  examId: string;
  studentId: string;
  score: number;
  feedback?: string;
  answers?: {
    questionId: string;
    answer: string;
    points: number;
  }[];
}

@Injectable({
  providedIn: 'root'
})
export class ExamService {
  private apiUrl = `${environment.apiUrl}/exams`;

  constructor(private http: HttpClient) { }

  // Obtener exámenes por curso
  getExamsByCourse(courseId: string): Observable<Exam[]> {
    console.log(`Obteniendo exámenes para el curso: ${courseId}`);
    return this.http.get<Exam[]>(`${this.apiUrl}/course/${courseId}`)
      .pipe(
        map(exams => {
          console.log(`Se encontraron ${exams.length} exámenes para el curso ${courseId}`);
          return exams;
        }),
        catchError(error => {
          console.error('Error obteniendo exámenes del curso:', error);
          return throwError(() => new Error('No se pudieron obtener los exámenes. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Obtener un examen por ID
  getExamById(examId: string): Observable<Exam> {
    return this.http.get<Exam>(`${this.apiUrl}/${examId}`)
      .pipe(
        catchError(error => {
          console.error('Error obteniendo examen:', error);
          return throwError(() => new Error('No se pudo obtener el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Crear un nuevo examen
  createExam(exam: Partial<Exam>): Observable<Exam> {
    return this.http.post<Exam>(this.apiUrl, exam)
      .pipe(
        catchError(error => {
          console.error('Error creando examen:', error);
          return throwError(() => new Error('No se pudo crear el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Actualizar un examen
  updateExam(examId: string, exam: Partial<Exam>): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${examId}`, exam)
      .pipe(
        catchError(error => {
          console.error('Error actualizando examen:', error);
          return throwError(() => new Error('No se pudo actualizar el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Eliminar un examen
  deleteExam(examId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${examId}`)
      .pipe(
        catchError(error => {
          console.error('Error eliminando examen:', error);
          return throwError(() => new Error('No se pudo eliminar el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Publicar un examen (cambiar estado a 'published')
  publishExam(examId: string): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${examId}/publish`, {})
      .pipe(
        catchError(error => {
          console.error('Error publicando examen:', error);
          return throwError(() => new Error('No se pudo publicar el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Completar un examen (cambiar estado a 'completed')
  completeExam(examId: string): Observable<Exam> {
    return this.http.patch<Exam>(`${this.apiUrl}/${examId}/complete`, {})
      .pipe(
        catchError(error => {
          console.error('Error completando examen:', error);
          return throwError(() => new Error('No se pudo completar el examen. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Agregar una pregunta a un examen
  addQuestion(examId: string, question: Partial<ExamQuestion>): Observable<Exam> {
    return this.http.post<Exam>(`${this.apiUrl}/${examId}/questions`, question)
      .pipe(
        catchError(error => {
          console.error('Error agregando pregunta:', error);
          return throwError(() => new Error('No se pudo agregar la pregunta. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Actualizar una pregunta
  updateQuestion(examId: string, questionId: string, question: Partial<ExamQuestion>): Observable<Exam> {
    return this.http.put<Exam>(`${this.apiUrl}/${examId}/questions/${questionId}`, question)
      .pipe(
        catchError(error => {
          console.error('Error actualizando pregunta:', error);
          return throwError(() => new Error('No se pudo actualizar la pregunta. Por favor, inténtelo de nuevo.'));
        })
      );
  }

  // Eliminar una pregunta
  deleteQuestion(examId: string, questionId: string): Observable<Exam> {
    return this.http.delete<Exam>(`${this.apiUrl}/${examId}/questions/${questionId}`)
      .pipe(
        catchError(error => {
          console.error('Error eliminando pregunta:', error);
          return throwError(() => new Error('No se pudo eliminar la pregunta. Por favor, inténtelo de nuevo.'));
        })
      );
  }
} 