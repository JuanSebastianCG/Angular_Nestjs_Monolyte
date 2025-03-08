import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../services/course.service';
import { EnrollmentService, Enrollment } from '../services/enrollment.service';
import { NotificationService } from '../components/notification/notification.service';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';

interface Course {
  _id: string;
  name: string;
  description: string;
  professorId?: string;
  professor: string;
  isEnrolled?: boolean;
  capacity?: number;
}

@Component({
  selector: 'app-inscribir',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, ReactiveFormsModule],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Header with role and user info -->
      <header class="bg-white p-4 border-b border-gray-200">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-xl font-semibold text-gray-700">
            Estudiante - Inscribir a Cursos
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-gray-700">{{ userName }}</span>
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

      <!-- Navigation Menu -->
      <nav class="bg-white shadow-sm">
        <div class="container mx-auto">
          <ul class="flex">
            <li class="mr-1">
              <a
                routerLink="/home"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Home
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/cursos"
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Mis Cursos
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/inscribir"
                routerLinkActive="border-b-2 border-blue-600 text-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Inscribir
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/notas"
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Notas
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto py-6 px-4">
        <h2 class="text-xl font-semibold text-gray-800 mb-6">
          Cursos Disponibles
        </h2>

        <!-- Search and Filter -->
        <div class="bg-white p-4 rounded-md shadow-sm mb-6">
          <div class="flex flex-col md:flex-row gap-4">
            <div class="flex-grow">
              <input
                type="text"
                placeholder="Buscar cursos..."
                class="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="text-center p-8">
          <p class="text-gray-600">Cargando cursos disponibles...</p>
        </div>

        <!-- Error message -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
        >
          {{ errorMessage }}
          <button
            (click)="loadAvailableCourses()"
            class="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>

        <!-- Courses List -->
        <div *ngIf="!isLoading && !errorMessage" class="grid grid-cols-1 gap-4">
          <div
            *ngFor="let course of availableCourses"
            class="bg-white p-4 rounded-md shadow-sm border border-gray-200"
          >
            <div
              class="flex flex-col md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h3 class="text-lg font-medium text-gray-800">
                  {{ course.name }}
                </h3>
                <p class="text-gray-600 mt-1">{{ course.description }}</p>
                <p class="text-gray-500 text-sm mt-1">
                  Profesor: {{ course.professor }}
                </p>
              </div>

              <div class="mt-4 md:mt-0">
                <button
                  *ngIf="!course.isEnrolled"
                  (click)="enrollInCourse(course._id)"
                  class="bg-blue-600 text-white px-4 py-1 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Inscribir
                </button>
                <span
                  *ngIf="course.isEnrolled"
                  class="inline-flex items-center px-3 py-1 rounded-md bg-green-100 text-green-800"
                >
                  <svg
                    class="w-4 h-4 mr-1"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fill-rule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clip-rule="evenodd"
                    ></path>
                  </svg>
                  Inscrito
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- No courses message -->
        <div
          *ngIf="!isLoading && !errorMessage && availableCourses.length === 0"
          class="text-center p-8"
        >
          <p class="text-gray-600">
            No hay cursos disponibles para inscripción
          </p>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class InscribirComponent implements OnInit {
  availableCourses: Course[] = [];
  userName: string = '';
  userId: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private enrollmentService: EnrollmentService,
    private notificationService: NotificationService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get the user data from auth service
    const currentUser = this.authService.currentUserValue;
    this.userName = currentUser?.name || '';
    this.userId = currentUser?.id || '';

    // Only students should access this page
    if (currentUser?.role?.toLowerCase() !== 'student') {
      this.router.navigate(['/home']);
      return;
    }

    // Load available courses
    this.loadAvailableCourses();
  }

  loadAvailableCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('Loading available courses for student ID:', this.userId);

    // Get all courses
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        console.log(`Retrieved ${courses.length} total courses from server`);

        // Check user enrollments
        this.enrollmentService.getEnrollmentsByStudent(this.userId).subscribe({
          next: (enrollments) => {
            console.log(
              `Retrieved ${enrollments.length} enrollments for student`,
            );

            // Extraer IDs de cursos en los que el estudiante está inscrito
            const enrolledCourseIds = enrollments
              .map((e) => {
                // Manejar tanto si courseId es un string como si es un objeto
                if (typeof e.courseId === 'string') {
                  return e.courseId;
                } else if (e.courseId && e.courseId._id) {
                  return e.courseId._id;
                }
                return null;
              })
              .filter((id) => id !== null);

            console.log('Enrolled course IDs:', enrolledCourseIds);

            // Filtrar los cursos: solo mostrar aquellos en los que NO está inscrito
            this.availableCourses = courses
              .filter((course) => !enrolledCourseIds.includes(course._id)) // Filtrar cursos ya inscritos
              .map((course) => ({
                _id: course._id,
                name: course.name,
                description: course.description,
                capacity: course.capacity || 0, // Agregar la propiedad capacity
                professorId: course.professorId,
                professor: course.professor || course.professorId, // Si existe el nombre del profesor, usarlo
                isEnrolled: false, // Ya sabemos que no está inscrito porque los filtramos
              }));

            console.log(
              `Displaying ${this.availableCourses.length} available courses for enrollment`,
            );
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading enrollments:', error);
            this.errorMessage =
              'Error al cargar las inscripciones. Por favor, inténtelo de nuevo.';
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage =
          'Error al cargar los cursos. Por favor, inténtelo de nuevo.';
        this.isLoading = false;
      },
    });
  }

  enrollInCourse(courseId: string): void {
    if (!this.userId) {
      this.notificationService.error(
        'No se puede inscribir al curso. Usuario no identificado.',
      );
      return;
    }

    // Create enrollment data
    const today = new Date();
    const endDate = new Date();
    endDate.setMonth(endDate.getMonth() + 4); // 4 months from now

    const enrollment: Enrollment = {
      studentId: this.userId,
      courseId: courseId,
      enrollmentStartDate: today.toISOString().split('T')[0],
      enrollmentEndDate: endDate.toISOString().split('T')[0],
      status: 'start',
    };

    this.enrollmentService.createEnrollment(enrollment).subscribe({
      next: (response) => {
        // Update UI to show enrolled
        const courseIndex = this.availableCourses.findIndex(
          (c) => c._id === courseId,
        );
        if (courseIndex >= 0) {
          this.availableCourses[courseIndex].isEnrolled = true;
        }

        this.notificationService.success('Inscripción exitosa');

        // Recargar la lista de cursos para actualizar el estado
        this.loadAvailableCourses();
      },
      error: (error) => {
        console.error('Error enrolling in course:', error);

        // Mostrar mensaje detallado del error al usuario
        let errorMessage =
          'Error al inscribirse en el curso. Por favor, inténtelo de nuevo.';

        // Verificar si el error es por falta de prerrequisitos
        if (error.error && error.error.message) {
          if (
            error.error.message.includes('prerequisite') ||
            error.error.message.includes('prerrequisito')
          ) {
            errorMessage =
              'No puedes inscribirte en este curso porque no cumples con los prerrequisitos necesarios.';
          } else {
            // Mostrar el mensaje exacto de la API para pruebas
            errorMessage = `Error del servidor: ${error.error.message}`;
          }
        }

        // Mostrar detalles completos para depuración
        console.log('Detalles del error:', JSON.stringify(error, null, 2));

        this.notificationService.error(errorMessage);
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
