import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { GradeService } from '../services/grade.service';
import { CourseService } from '../services/course.service';

interface Grade {
  _id: string;
  studentId: string;
  courseId: string;
  courseName?: string;
  value: number;
  date: string;
  comments?: string;
}

@Component({
  selector: 'app-notas',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Header with role and user info -->
      <header class="bg-white p-4 border-b border-gray-200">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-xl font-semibold text-gray-700">
            Estudiante - Mis Notas
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
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Inscribir
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/notas"
                routerLinkActive="border-b-2 border-blue-600 text-blue-600"
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
          Mis Calificaciones
        </h2>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="text-center p-8">
          <p class="text-gray-600">Cargando calificaciones...</p>
        </div>

        <!-- Error message -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
        >
          {{ errorMessage }}
          <button
            (click)="loadGrades()"
            class="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>

        <!-- Grades Table -->
        <div
          *ngIf="!isLoading && !errorMessage && grades.length > 0"
          class="bg-white rounded-lg shadow overflow-hidden"
        >
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Curso
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Calificación
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Fecha
                </th>
                <th
                  scope="col"
                  class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Comentarios
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let grade of grades">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm font-medium text-gray-900">
                    {{ grade.courseName }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div
                    class="text-sm font-medium"
                    [ngClass]="getGradeColorClass(grade.value)"
                  >
                    {{ grade.value }}
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-500">
                    {{ formatDate(grade.date) }}
                  </div>
                </td>
                <td class="px-6 py-4 text-sm text-gray-500">
                  {{ grade.comments || 'Sin comentarios' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- No grades message -->
        <div
          *ngIf="!isLoading && !errorMessage && grades.length === 0"
          class="text-center p-8 bg-white rounded-lg shadow"
        >
          <p class="text-gray-600">No tienes calificaciones registradas</p>
        </div>

        <!-- GPA Summary -->
        <div
          *ngIf="grades.length > 0"
          class="mt-6 bg-white p-6 rounded-lg shadow"
        >
          <div
            class="flex flex-col md:flex-row md:justify-between md:items-center"
          >
            <div>
              <h3 class="text-lg font-medium text-gray-900">
                Resumen Académico
              </h3>
              <p class="text-sm text-gray-500 mt-1">
                Promedio basado en todas tus calificaciones
              </p>
            </div>
            <div class="mt-4 md:mt-0">
              <div
                class="text-3xl font-bold"
                [ngClass]="getGradeColorClass(averageGrade)"
              >
                {{ averageGrade.toFixed(1) }}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class NotasComponent implements OnInit {
  grades: Grade[] = [];
  userName: string = '';
  userId: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  averageGrade: number = 0;

  constructor(
    private authService: AuthService,
    private gradeService: GradeService,
    private courseService: CourseService,
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

    this.loadGrades();
  }

  loadGrades(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Get student grades
    this.gradeService.getGradesByStudent(this.userId).subscribe({
      next: (grades) => {
        // Get courses to get their names
        const courseIds = [...new Set(grades.map((g) => g.courseId))];

        if (courseIds.length === 0) {
          this.grades = [];
          this.isLoading = false;
          this.calculateAverageGrade();
          return;
        }

        // For each course, get the name
        this.courseService.getCoursesById(courseIds).subscribe({
          next: (courses) => {
            // Create a map of course IDs to names
            const courseMap = new Map();
            courses.forEach((course) => {
              courseMap.set(course._id, course.name);
            });

            // Add the course name to each grade
            this.grades = grades.map((grade) => ({
              ...grade,
              courseName: courseMap.get(grade.courseId) || 'Curso desconocido',
            }));

            this.calculateAverageGrade();
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading courses:', error);
            // Even if there's an error with courses, still show grades
            this.grades = grades;
            this.calculateAverageGrade();
            this.isLoading = false;
          },
        });
      },
      error: (error) => {
        console.error('Error loading grades:', error);
        this.errorMessage =
          'No se pudieron cargar tus calificaciones. Por favor, inténtalo más tarde.';
        this.isLoading = false;
      },
    });
  }

  calculateAverageGrade(): void {
    if (this.grades.length === 0) {
      this.averageGrade = 0;
      return;
    }

    const sum = this.grades.reduce((total, grade) => total + grade.value, 0);
    this.averageGrade = sum / this.grades.length;
  }

  getGradeColorClass(value: number): string {
    if (value >= 90) return 'text-green-600';
    if (value >= 80) return 'text-green-500';
    if (value >= 70) return 'text-yellow-600';
    if (value >= 60) return 'text-orange-500';
    return 'text-red-600';
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
  }
}
