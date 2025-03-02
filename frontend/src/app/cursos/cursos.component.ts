import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../services/course.service';
import { CourseCardComponent } from '../components/course-card/course-card.component';

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
  professorId?: string;
  professor?: string;
  schedule?: Schedule;
  department?: string;
  enrolledStudents?: number;
}

@Component({
  selector: 'app-cursos',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, CourseCardComponent],
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

      <!-- Navigation Menu - Dynamic based on user role -->
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
                routerLinkActive="border-b-2 border-blue-600 text-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                {{ userRole === 'student' ? 'Mis Cursos' : 'Cursos' }}
              </a>
            </li>

            <!-- Admin Menu Items -->
            <li class="mr-1" *ngIf="userRole === 'admin'">
              <a
                routerLink="/departamentos"
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Departamentos
              </a>
            </li>

            <!-- Student Menu Items -->
            <li class="mr-1" *ngIf="userRole === 'student'">
              <a
                routerLink="/inscribir"
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Inscribir
              </a>
            </li>
            <li class="mr-1" *ngIf="userRole === 'student'">
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
        <!-- Create Course Button (Admin Only) -->
        <div class="mb-6" *ngIf="userRole === 'admin'">
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            (click)="createNewCourse()"
          >
            Crear Curso
          </button>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="text-center p-8">
          <p class="text-gray-600">Cargando cursos...</p>
        </div>

        <!-- Error message -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
        >
          {{ errorMessage }}
          <button
            (click)="loadCourses()"
            class="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>

        <!-- Course Grid -->
        <div
          *ngIf="!isLoading && !errorMessage"
          class="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <app-course-card
            *ngFor="let course of courses"
            [course]="course"
            [userRole]="userRole"
            (viewDetails)="viewCourseDetails($event)"
            (edit)="editCourse($event)"
            (delete)="deleteCourse($event)"
          ></app-course-card>
        </div>

        <!-- No courses message -->
        <div
          *ngIf="!isLoading && !errorMessage && courses.length === 0"
          class="text-center p-8"
        >
          <p class="text-gray-600">No hay cursos disponibles</p>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class CursosComponent implements OnInit {
  courses: Course[] = [];
  userName: string = '';
  userRole: 'student' | 'professor' | 'admin' = 'student';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get the user data from auth service
    const currentUser = this.authService.currentUserValue;
    this.userName = currentUser?.name || '';

    // Set user role
    if (currentUser?.role) {
      const role = currentUser.role.toLowerCase();
      if (role === 'student' || role === 'professor' || role === 'admin') {
        this.userRole = role as 'student' | 'professor' | 'admin';
      }
    }

    // Load courses based on role
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';

    // Use real API call with CourseService
    this.courseService.getAllCourses().subscribe({
      next: (apiCourses) => {
        // Process courses based on user role
        this.courses = apiCourses.map((course) => ({
          _id: course._id,
          name: course.name,
          description: course.description,
          professorId: course.professorId,
          schedule: course.schedule,
          // Add any transformations needed for displaying in UI
        }));
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage =
          'No se pudieron cargar los cursos. Por favor intente de nuevo.';
        this.isLoading = false;
      },
    });
  }

  getPageTitle(): string {
    switch (this.userRole) {
      case 'student':
        return 'Estudiante - Mis Cursos';
      case 'professor':
        return 'Profesor - Mis Cursos';
      case 'admin':
        return 'Admin - Gestión de Cursos';
      default:
        return 'Cursos';
    }
  }

  viewCourseDetails(courseId: string): void {
    console.log('View course details:', courseId);
    // Navigate to course details
    this.router.navigate(['/cursos', courseId]);
  }

  createNewCourse(): void {
    console.log('Create new course');
    // Navigate to course creation form
    this.router.navigate(['/cursos/new']);
  }

  editCourse(courseId: string): void {
    console.log('Edit course:', courseId);
    // Navigate to course edit form
    this.router.navigate(['/cursos', courseId, 'edit']);
  }

  deleteCourse(courseId: string): void {
    console.log('Delete course:', courseId);
    // Call the course service to delete the course
    this.courseService.deleteCourse(courseId).subscribe({
      next: () => {
        // Remove the course from the list
        this.courses = this.courses.filter((course) => course._id !== courseId);
      },
      error: (error) => {
        console.error('Error deleting course:', error);
        // Show error notification
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }
}
