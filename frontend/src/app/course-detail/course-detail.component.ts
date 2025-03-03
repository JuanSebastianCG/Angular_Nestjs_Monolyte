import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { CourseService, Course } from '../services/course.service';
import { EnrollmentService } from '../services/enrollment.service';
import { NotificationService } from '../components/notification/notification.service';

interface Student {
  _id: string;
  name: string;
  email: string;
  enrollmentDate: string;
  status: string;
}

interface Evaluation {
  _id: string;
  title: string;
  description: string;
  dueDate: string;
  totalPoints: number;
  type: 'quiz' | 'exam' | 'assignment' | 'project';
  createdAt: string;
}

interface Grade {
  _id: string;
  studentId: string;
  studentName: string;
  evaluationId: string;
  evaluationTitle: string;
  score: number;
  feedback: string;
  submissionDate: string;
}

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Header with role and user info -->
      <header class="bg-white p-4 border-b border-gray-200">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-xl font-semibold text-gray-700">
            {{ getPageTitle() }}
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-gray-700">{{ userName }}</span>
            <button
              (click)="navigateBack()"
              class="flex items-center text-gray-600 hover:text-blue-600 mr-4"
            >
              <svg
                class="w-5 h-5 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                ></path>
              </svg>
              Volver
            </button>
            <button
              (click)="logout()"
              class="flex items-center text-gray-600 hover:text-red-600"
            >
              Cerrar sesión
              <svg
                class="w-5 h-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="container mx-auto py-6 px-4">
        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="text-center p-8">
          <p class="text-gray-600">Cargando información del curso...</p>
        </div>

        <!-- Error message -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
        >
          {{ errorMessage }}
          <button
            (click)="loadCourseDetails()"
            class="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>

        <!-- Course Details -->
        <div *ngIf="!isLoading && !errorMessage && course">
          <!-- Course Header -->
          <div class="bg-white p-6 rounded-lg shadow-sm mb-6">
            <h1 class="text-2xl font-bold text-gray-800 mb-2">
              {{ course.name }}
            </h1>
            <p class="text-gray-600 mb-4">{{ course.description }}</p>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <p class="text-sm text-gray-500">Profesor</p>
                <p class="font-medium">{{ course.professor || 'No asignado' }}</p>
              </div>
              <div>
                <p class="text-sm text-gray-500">Departamento</p>
                <p class="font-medium">{{ course.department || 'No asignado' }}</p>
              </div>
              
              <div *ngIf="course.schedule && course.schedule.room">
                <p class="text-sm text-gray-500">Aula</p>
                <p class="font-medium">{{ course.schedule.room }}</p>
              </div>
              <div *ngIf="course.schedule && course.schedule.days && course.schedule.days.length">
                <p class="text-sm text-gray-500">Horario</p>
                <p class="font-medium">
                  {{ course.schedule.days.join(', ') }} de 
                  {{ course.schedule.startTime || '00:00' }} a {{ course.schedule.endTime || '00:00' }}
                </p>
              </div>
            </div>

            <!-- Prerequisites -->
            <div *ngIf="prerequisites.length > 0" class="mt-4 border-t pt-4">
              <h3 class="text-md font-semibold text-gray-700 mb-2">Requisitos Previos</h3>
              <ul class="list-disc list-inside text-gray-600">
                <li *ngFor="let prereq of prerequisites">{{ prereq.name }}</li>
              </ul>
            </div>
          </div>

          <!-- Tabs -->
          <div class="mb-6">
            <div class="border-b border-gray-200">
              <nav class="-mb-px flex">
                <button
                  (click)="setActiveTab('students')"
                  class="py-4 px-6 border-b-2 font-medium text-sm"
                  [ngClass]="activeTab === 'students' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  Estudiantes
                </button>
                <button
                  (click)="setActiveTab('evaluations')"
                  class="py-4 px-6 border-b-2 font-medium text-sm"
                  [ngClass]="activeTab === 'evaluations' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  Evaluaciones
                </button>
                <button
                  (click)="setActiveTab('grades')"
                  class="py-4 px-6 border-b-2 font-medium text-sm"
                  [ngClass]="activeTab === 'grades' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  Calificaciones
                </button>
              </nav>
            </div>
          </div>

          <!-- Tab Content -->
          <!-- Students Tab -->
          <div *ngIf="activeTab === 'students'" class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Estudiantes Inscritos</h2>
              <button
                *ngIf="userRole === 'professor' || userRole === 'admin'"
                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                (click)="showAddStudentsModal()"
              >
                Agregar Estudiantes
              </button>
            </div>

            <!-- Loading indicator for students -->
            <div *ngIf="studentsLoading" class="text-center p-8">
              <p class="text-gray-600">Cargando estudiantes...</p>
            </div>

            <!-- Student list -->
            <div *ngIf="!studentsLoading && students.length === 0" class="text-center p-8">
              <p class="text-gray-600">No hay estudiantes inscritos en este curso.</p>
            </div>

            <div *ngIf="!studentsLoading && students.length > 0" class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nombre
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Inscripción
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th *ngIf="userRole === 'professor' || userRole === 'admin'" class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let student of students">
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ student.name }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      {{ student.email }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      {{ formatDate(student.enrollmentDate) }}
                    </td>
                    <td class="py-4 px-4 text-sm">
                      <span
                        [ngClass]="{
                          'bg-green-100 text-green-800': student.status === 'start',
                          'bg-yellow-100 text-yellow-800': student.status === 'pending',
                          'bg-blue-100 text-blue-800': student.status === 'finish'
                        }"
                        class="px-2 py-1 rounded-full text-xs"
                      >
                        {{ getStatusText(student.status) }}
                      </span>
                    </td>
                    <td *ngIf="userRole === 'professor' || userRole === 'admin'" class="py-4 px-4 text-sm text-gray-500">
                      <button
                        class="text-blue-600 hover:text-blue-800 mr-2"
                        (click)="viewStudentDetails(student._id)"
                      >
                        Ver
                      </button>
                      <button
                        class="text-red-600 hover:text-red-800"
                        (click)="removeStudent(student._id)"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Evaluations Tab -->
          <div *ngIf="activeTab === 'evaluations'" class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Evaluaciones</h2>
              <button
                *ngIf="userRole === 'professor' || userRole === 'admin'"
                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                (click)="showAddEvaluationModal()"
              >
                Crear Evaluación
              </button>
            </div>

            <!-- Loading indicator for evaluations -->
            <div *ngIf="evaluationsLoading" class="text-center p-8">
              <p class="text-gray-600">Cargando evaluaciones...</p>
            </div>

            <!-- Evaluations list -->
            <div *ngIf="!evaluationsLoading && evaluations.length === 0" class="text-center p-8">
              <p class="text-gray-600">No hay evaluaciones para este curso.</p>
            </div>

            <div *ngIf="!evaluationsLoading && evaluations.length > 0" class="grid grid-cols-1 gap-4">
              <div
                *ngFor="let evaluation of evaluations"
                class="border border-gray-200 rounded-lg p-4"
              >
                <div class="flex justify-between">
                  <h3 class="text-lg font-medium text-gray-800">{{ evaluation.title }}</h3>
                  <span
                    [ngClass]="{
                      'bg-green-100 text-green-800': isEvaluationUpcoming(evaluation.dueDate),
                      'bg-yellow-100 text-yellow-800': isEvaluationDueSoon(evaluation.dueDate),
                      'bg-red-100 text-red-800': isEvaluationPast(evaluation.dueDate)
                    }"
                    class="px-2 py-1 rounded-full text-xs"
                  >
                    {{ getEvaluationStatusText(evaluation.dueDate) }}
                  </span>
                </div>
                <p class="text-gray-600 text-sm mt-2">{{ evaluation.description }}</p>
                <div class="flex justify-between mt-3 pt-3 border-t border-gray-100 text-sm">
                  <div>
                    <span class="text-gray-500">Tipo:</span> {{ formatEvaluationType(evaluation.type) }}
                  </div>
                  <div>
                    <span class="text-gray-500">Puntos:</span> {{ evaluation.totalPoints }}
                  </div>
                  <div>
                    <span class="text-gray-500">Fecha límite:</span> {{ formatDate(evaluation.dueDate) }}
                  </div>
                </div>
                <div *ngIf="userRole === 'professor' || userRole === 'admin'" class="flex justify-end mt-3">
                  <button
                    class="text-blue-600 hover:text-blue-800 mr-2 text-sm"
                    (click)="editEvaluation(evaluation._id)"
                  >
                    Editar
                  </button>
                  <button
                    class="text-red-600 hover:text-red-800 text-sm"
                    (click)="removeEvaluation(evaluation._id)"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Grades Tab -->
          <div *ngIf="activeTab === 'grades'" class="bg-white p-6 rounded-lg shadow-sm">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold text-gray-800">Calificaciones</h2>
              <button
                *ngIf="userRole === 'professor' || userRole === 'admin'"
                class="bg-blue-600 text-white px-4 py-2 rounded-md text-sm hover:bg-blue-700"
                (click)="showAddGradeModal()"
              >
                Agregar Calificación
              </button>
            </div>

            <!-- Loading indicator for grades -->
            <div *ngIf="gradesLoading" class="text-center p-8">
              <p class="text-gray-600">Cargando calificaciones...</p>
            </div>

            <!-- Filter options for professors and admins -->
            <div *ngIf="(userRole === 'professor' || userRole === 'admin') && !gradesLoading" class="mb-4">
              <div class="flex flex-wrap items-center gap-4">
                <div>
                  <label for="studentFilter" class="block text-sm font-medium text-gray-700">Filtrar por Estudiante</label>
                  <select 
                    id="studentFilter"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    (change)="filterGradesByStudent($event)"
                  >
                    <option value="">Todos los estudiantes</option>
                    <option *ngFor="let student of students" [value]="student._id">{{ student.name }}</option>
                  </select>
                </div>
                
                <div>
                  <label for="evaluationFilter" class="block text-sm font-medium text-gray-700">Filtrar por Evaluación</label>
                  <select 
                    id="evaluationFilter"
                    class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    (change)="filterGradesByEvaluation($event)"
                  >
                    <option value="">Todas las evaluaciones</option>
                    <option *ngFor="let evaluation of evaluations" [value]="evaluation._id">{{ evaluation.title }}</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- Grades list -->
            <div *ngIf="!gradesLoading && filteredGrades.length === 0" class="text-center p-8">
              <p class="text-gray-600">No hay calificaciones disponibles.</p>
            </div>

            <!-- Student view of grades (only their own) -->
            <div *ngIf="userRole === 'student' && !gradesLoading && filteredGrades.length > 0" class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evaluación
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntuación
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha de Entrega
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comentarios
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let grade of filteredGrades">
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ grade.evaluationTitle }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ grade.score }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      {{ formatDate(grade.submissionDate) }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      {{ grade.feedback || 'Sin comentarios' }}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Professor/Admin view of grades (all students) -->
            <div *ngIf="(userRole === 'professor' || userRole === 'admin') && !gradesLoading && filteredGrades.length > 0" class="overflow-x-auto">
              <table class="min-w-full bg-white">
                <thead class="bg-gray-100">
                  <tr>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estudiante
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Evaluación
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Puntuación
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th class="py-3 px-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr *ngFor="let grade of filteredGrades">
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ grade.studentName }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ grade.evaluationTitle }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-900">
                      {{ grade.score }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      {{ formatDate(grade.submissionDate) }}
                    </td>
                    <td class="py-4 px-4 text-sm text-gray-500">
                      <button
                        class="text-blue-600 hover:text-blue-800 mr-2"
                        (click)="editGrade(grade._id)"
                      >
                        Editar
                      </button>
                      <button
                        class="text-red-600 hover:text-red-800"
                        (click)="removeGrade(grade._id)"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: Course | null = null;
  prerequisites: any[] = [];
  userName: string = '';
  userId: string = '';
  userRole: 'student' | 'professor' | 'admin' = 'student';
  isLoading: boolean = false;
  errorMessage: string = '';
  
  // Active tab
  activeTab: 'students' | 'evaluations' | 'grades' = 'students';
  
  // Students tab
  students: Student[] = [];
  studentsLoading: boolean = false;
  
  // Evaluations tab
  evaluations: Evaluation[] = [];
  evaluationsLoading: boolean = false;
  
  // Grades tab
  grades: Grade[] = [];
  filteredGrades: Grade[] = [];
  gradesLoading: boolean = false;
  
  // Filters
  selectedStudentId: string = '';
  selectedEvaluationId: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get user data
    const currentUser = this.authService.currentUserValue;
    this.userName = currentUser?.name || '';
    this.userId = currentUser?.id || '';

    // Set user role
    if (currentUser?.role) {
      const role = currentUser.role.toLowerCase();
      if (role === 'student' || role === 'professor' || role === 'admin') {
        this.userRole = role as 'student' | 'professor' | 'admin';
      }
    }

    // Get course ID from route params
    this.route.params.subscribe(params => {
      this.courseId = params['id'];
      if (this.courseId) {
        this.loadCourseDetails();
      } else {
        this.errorMessage = 'ID de curso no proporcionado';
      }
    });
  }

  // Load course details from API
  loadCourseDetails(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        this.course = course;
        this.loadPrerequisites();
        this.loadTabData(this.activeTab);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading course details:', error);
        this.errorMessage = 'No se pudo cargar la información del curso. Por favor intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  // Load prerequisites for the course
  loadPrerequisites(): void {
    if (!this.courseId) return;
    
    this.courseService.getCoursePrerequisites(this.courseId).subscribe({
      next: (prerequisites) => {
        this.prerequisites = prerequisites;
      },
      error: (error) => {
        console.error('Error loading prerequisites:', error);
        // No interrumpimos la carga del curso si no se pueden cargar los prerrequisitos
      }
    });
  }

  // Change active tab
  setActiveTab(tab: 'students' | 'evaluations' | 'grades'): void {
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  // Load data for specific tab
  loadTabData(tab: 'students' | 'evaluations' | 'grades'): void {
    switch (tab) {
      case 'students':
        this.loadStudents();
        break;
      case 'evaluations':
        this.loadEvaluations();
        break;
      case 'grades':
        this.loadGrades();
        break;
    }
  }

  // Load students enrolled in the course
  loadStudents(): void {
    if (!this.courseId) return;
    
    this.studentsLoading = true;
    this.courseService.getEnrolledStudents(this.courseId).subscribe({
      next: (students) => {
        this.students = students;
        this.studentsLoading = false;
      },
      error: (error) => {
        console.error('Error loading students:', error);
        this.studentsLoading = false;
      }
    });
  }

  // Load evaluations for the course
  loadEvaluations(): void {
    if (!this.courseId) return;
    
    this.evaluationsLoading = true;
    // Este servicio no existe aún, pero se implementaría para obtener evaluaciones
    // evaluationService.getEvaluationsByCourse(this.courseId).subscribe...
    
    // Simulación de datos para demostración
    setTimeout(() => {
      this.evaluations = [
        {
          _id: '1',
          title: 'Examen Parcial',
          description: 'Evaluación de los conceptos vistos en la primera mitad del curso',
          dueDate: new Date(new Date().getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 días en el futuro
          totalPoints: 100,
          type: 'exam',
          createdAt: new Date().toISOString()
        },
        {
          _id: '2',
          title: 'Proyecto Final',
          description: 'Implementación práctica de todos los conceptos del curso',
          dueDate: new Date(new Date().getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 días en el futuro
          totalPoints: 150,
          type: 'project',
          createdAt: new Date().toISOString()
        }
      ];
      this.evaluationsLoading = false;
    }, 500);
  }

  // Load grades for the course
  loadGrades(): void {
    if (!this.courseId) return;
    
    this.gradesLoading = true;
    // Este servicio no existe aún, pero se implementaría para obtener calificaciones
    // gradeService.getGradesByCourse(this.courseId).subscribe...
    
    // Simulación de datos para demostración
    setTimeout(() => {
      if (this.userRole === 'student') {
        // Estudiantes solo ven sus propias calificaciones
        this.grades = [
          {
            _id: '1',
            studentId: this.userId,
            studentName: this.userName,
            evaluationId: '1',
            evaluationTitle: 'Examen Parcial',
            score: 85,
            feedback: 'Buen trabajo, pero necesitas mejorar en la sección 3.',
            submissionDate: new Date().toISOString()
          }
        ];
      } else {
        // Profesores y admins ven todas las calificaciones
        this.grades = [
          {
            _id: '1',
            studentId: 'student1',
            studentName: 'Estudiante 1',
            evaluationId: '1',
            evaluationTitle: 'Examen Parcial',
            score: 85,
            feedback: 'Buen trabajo, pero necesitas mejorar en la sección 3.',
            submissionDate: new Date().toISOString()
          },
          {
            _id: '2',
            studentId: 'student2',
            studentName: 'Estudiante 2',
            evaluationId: '1',
            evaluationTitle: 'Examen Parcial',
            score: 92,
            feedback: 'Excelente trabajo!',
            submissionDate: new Date().toISOString()
          }
        ];
      }
      
      this.filteredGrades = [...this.grades];
      this.gradesLoading = false;
    }, 500);
  }

  // Filter grades by student
  filterGradesByStudent(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedStudentId = target.value;
    this.applyGradesFilters();
  }

  // Filter grades by evaluation
  filterGradesByEvaluation(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedEvaluationId = target.value;
    this.applyGradesFilters();
  }

  // Apply filters to grades
  applyGradesFilters(): void {
    this.filteredGrades = this.grades.filter(grade => {
      const matchesStudent = !this.selectedStudentId || grade.studentId === this.selectedStudentId;
      const matchesEvaluation = !this.selectedEvaluationId || grade.evaluationId === this.selectedEvaluationId;
      return matchesStudent && matchesEvaluation;
    });
  }

  // MODAL ACTIONS (to be implemented)
  showAddStudentsModal(): void {
    // Implementar para mostrar modal que permita agregar estudiantes
    this.notificationService.info('Función por implementar: Agregar estudiantes');
  }

  showAddEvaluationModal(): void {
    // Implementar para mostrar modal que permita crear evaluación
    this.notificationService.info('Función por implementar: Crear evaluación');
  }

  showAddGradeModal(): void {
    // Implementar para mostrar modal que permita agregar calificación
    this.notificationService.info('Función por implementar: Agregar calificación');
  }

  // CRUD ACTIONS FOR STUDENTS
  viewStudentDetails(studentId: string): void {
    // Navegación a detalles de estudiante o mostrar modal
    this.notificationService.info(`Ver detalles del estudiante ${studentId}`);
  }

  removeStudent(studentId: string): void {
    if (confirm('¿Está seguro que desea eliminar este estudiante del curso?')) {
      // Implementar eliminación
      this.notificationService.success('Estudiante eliminado del curso');
      // Recargar lista de estudiantes
      this.loadStudents();
    }
  }

  // CRUD ACTIONS FOR EVALUATIONS
  editEvaluation(evaluationId: string): void {
    // Implementar edición de evaluación
    this.notificationService.info(`Editar evaluación ${evaluationId}`);
  }

  removeEvaluation(evaluationId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta evaluación?')) {
      // Implementar eliminación
      this.notificationService.success('Evaluación eliminada');
      // Recargar lista de evaluaciones
      this.loadEvaluations();
    }
  }

  // CRUD ACTIONS FOR GRADES
  editGrade(gradeId: string): void {
    // Implementar edición de calificación
    this.notificationService.info(`Editar calificación ${gradeId}`);
  }

  removeGrade(gradeId: string): void {
    if (confirm('¿Está seguro que desea eliminar esta calificación?')) {
      // Implementar eliminación
      this.notificationService.success('Calificación eliminada');
      // Recargar lista de calificaciones
      this.loadGrades();
    }
  }

  // UTILITY METHODS
  getPageTitle(): string {
    if (!this.course) return 'Detalle de Curso';
    return `${this.course.name}`;
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  getStatusText(status: string): string {
    switch (status) {
      case 'start': return 'Activo';
      case 'finish': return 'Completado';
      default: return 'Pendiente';
    }
  }

  formatEvaluationType(type: string): string {
    switch (type) {
      case 'quiz': return 'Cuestionario';
      case 'exam': return 'Examen';
      case 'assignment': return 'Tarea';
      case 'project': return 'Proyecto';
      default: return type;
    }
  }

  isEvaluationUpcoming(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays > 3;
  }

  isEvaluationDueSoon(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 3;
  }

  isEvaluationPast(dateString: string): boolean {
    const date = new Date(dateString);
    const now = new Date();
    return date < now;
  }

  getEvaluationStatusText(dateString: string): string {
    if (this.isEvaluationPast(dateString)) return 'Finalizado';
    if (this.isEvaluationDueSoon(dateString)) return 'Próximamente';
    return 'Pendiente';
  }

  navigateBack(): void {
    this.router.navigate(['/cursos']);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
} 