import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { CourseService } from '../services/course.service';
import { Course as ApiCourse } from '../models/course.model';
import { Prerequisite } from '../models/prerequisite.model';
import { CourseCardComponent, Course as UiCourse } from '../components/shared/course-card/course-card.component';
import { forkJoin, of } from 'rxjs';
import { switchMap, catchError, map } from 'rxjs/operators';

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
        <!-- Filter Options (Admin/Professor view) -->
        <div class="mb-6 flex flex-wrap items-center gap-4" *ngIf="userRole !== 'student'">
          <div>
            <label for="filter" class="block text-sm font-medium text-gray-700">Filtrar por:</label>
            <select 
              id="filter" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              (change)="applyFilter($event)"
            >
              <option value="all">Todos los cursos</option>
              <option value="mine" *ngIf="userRole === 'professor'">Mis cursos</option>
              <option value="department">Por departamento</option>
            </select>
          </div>
          
          <div *ngIf="showDepartmentFilter">
            <label for="department" class="block text-sm font-medium text-gray-700">Departamento:</label>
            <select 
              id="department" 
              class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
              (change)="filterByDepartment($event)"
            >
              <option value="">Seleccionar departamento</option>
              <option value="dept1">Departamento 1</option>
              <option value="dept2">Departamento 2</option>
            </select>
          </div>
        </div>

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
            *ngFor="let course of uiCourses"
            [course]="course"
            [showDetails]="userRole !== 'student'"
            [showDeleteButton]="userRole === 'admin'"
            [showActionButton]="true"
            [actionButtonText]="getActionButtonText(course)"
            (onDelete)="deleteCourse(course.id)"
            (onAction)="handleCourseAction(course)"
          ></app-course-card>
        </div>

        <!-- No courses message -->
        <div
          *ngIf="!isLoading && !errorMessage && uiCourses.length === 0"
          class="text-center p-8"
        >
          <p class="text-gray-600">{{ getNoCoursesMessage() }}</p>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class CursosComponent implements OnInit {
  apiCourses: ApiCourse[] = [];
  uiCourses: UiCourse[] = [];
  userName: string = '';
  userId: string = '';
  userRole: 'student' | 'professor' | 'admin' = 'student';
  isLoading: boolean = false;
  errorMessage: string = '';
  showDepartmentFilter: boolean = false;
  selectedFilter: string = 'all';
  selectedDepartment: string = '';

  constructor(
    private authService: AuthService,
    private courseService: CourseService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get the user data from auth service
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

    // Load courses based on role
    this.loadCourses();
  }

  loadCourses(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log(`Loading courses for user role: ${this.userRole}, userId: ${this.userId}`);

    // Determine which API call to make based on user role
    let courseObservable = this.courseService.getAllCourses();
    
    if (this.userRole === 'student') {
      console.log('Loading enrolled courses for student');
      courseObservable = this.courseService.getCoursesByStudent(this.userId);
    } else if (this.userRole === 'professor' && this.selectedFilter === 'mine') {
      console.log('Loading courses for professor');
      courseObservable = this.courseService.getCoursesByProfessor(this.userId);
    } else if (this.selectedFilter === 'department' && this.selectedDepartment) {
      console.log(`Loading courses for department: ${this.selectedDepartment}`);
      courseObservable = this.courseService.getCoursesByDepartment(this.selectedDepartment);
    } else {
      console.log('Loading all courses');
    }

    courseObservable.subscribe({
      next: (courses) => {
        console.log(`Received ${courses.length} courses from API`);
        this.apiCourses = courses;
        this.processCoursesForDisplay();
      },
      error: (error) => {
        console.error('Error loading courses:', error);
        this.errorMessage = 'No se pudieron cargar los cursos. Por favor intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  // Process API courses into UI format and load prerequisites if needed
  processCoursesForDisplay(): void {
    // Si no hay cursos, no hacemos nada
    if (!this.apiCourses || this.apiCourses.length === 0) {
      this.uiCourses = [];
      this.isLoading = false;
      return;
    }

    // Log para depuración
    console.log(`Procesando ${this.apiCourses.length} cursos para el usuario con rol ${this.userRole}`);

    // Procesamos los cursos directamente sin llamadas adicionales para obtener prerrequisitos
    this.uiCourses = this.apiCourses.map(course => {
      console.log(`Procesando curso: ${course.name} (${course._id})`);
      
      // Extraemos los prerrequisitos directamente del objeto curso
      const prerequisites = course.prerequisites || [];
      
      // Para estudiantes, los cursos que vienen de getCoursesByStudent ya tienen información de inscripción
      const isEnrolled = this.userRole === 'student' ? true : !!course.isEnrolled;
      
      // Obtenemos la información del horario
      const schedule = course.schedule || { 
        room: '',
        startTime: '', 
        endTime: '', 
        days: [],
        startDate: '',
        endDate: ''
      };
      
      // Convertimos a formato UI
      const uiCourse: UiCourse = {
        id: course._id,
        title: course.name,
        description: course.description,
        room: schedule.room,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        days: schedule.days,
        startDate: schedule.startDate,
        endDate: schedule.endDate,
        prerequisites: prerequisites,
        professor: course.professor,
        department: course.department,
        enrolledStudents: course.enrolledStudents?.length,
        isEnrolled: isEnrolled,
        enrollmentStatus: course.enrollmentStatus || '',
        enrollmentDate: course.enrollmentDate || ''
      };
      
      return uiCourse;
    });

    // Log para depuración
    console.log(`Procesados ${this.uiCourses.length} cursos para mostrar en la UI`);
    this.isLoading = false;
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
    console.log('Navegando a detalles del curso:', courseId);
    
    // Usar navigateByUrl para mayor simplicidad
    const url = `/cursos/${courseId}`;
    console.log('URL de navegación:', url);
    
    // Forzar navegación programática
    setTimeout(() => {
      this.router.navigateByUrl(url)
        .then(() => console.log('Navegación exitosa'))
        .catch(error => console.error('Error de navegación:', error));
    }, 100);
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
        this.uiCourses = this.uiCourses.filter((course) => course.id !== courseId);
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

  applyFilter(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedFilter = target.value;
    
    if (this.selectedFilter === 'department') {
      this.showDepartmentFilter = true;
    } else {
      this.showDepartmentFilter = false;
      this.loadCourses();
    }
  }

  filterByDepartment(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.selectedDepartment = target.value;
    if (this.selectedDepartment) {
      this.loadCourses();
    }
  }

  getNoCoursesMessage(): string {
    if (this.userRole === 'student') {
      return 'No estás inscrito en ningún curso.';
    } else if (this.selectedFilter === 'mine' && this.userRole === 'professor') {
      return 'No estás asignado a ningún curso.';
    } else if (this.selectedFilter === 'department') {
      return 'No hay cursos en este departamento.';
    }
    return 'No hay cursos disponibles.';
  }

  getActionButtonText(course: UiCourse): string {
    if (this.userRole === 'admin') {
      return 'Editar';
    } else if (this.userRole === 'professor') {
      return 'Ver Detalles';
    } else if (course.isEnrolled) {
      return 'Ver Detalles';
    } else {
      return 'Inscribir';
    }
  }

  handleCourseAction(course: UiCourse): void {
    // Registrar información detallada para depuración
    console.log('---------------------------------------');
    console.log('Course action triggered:', { 
      id: course.id, 
      title: course.title,
      userRole: this.userRole,
      isEnrolled: course.isEnrolled,
      actionType: this.getActionButtonText(course)
    });
    
    if (this.userRole === 'admin') {
      console.log('Admin - Editing course');
      this.editCourse(course.id);
    } else if (this.userRole === 'professor' || course.isEnrolled) {
      console.log('Viewing course details as', this.userRole);
      this.viewCourseDetails(course.id);
    } else {
      console.log('Student - Enrolling in course');
      this.enrollInCourse(course.id);
    }
  }

  enrollInCourse(courseId: string): void {
    this.isLoading = true;
    this.courseService.enrollStudentInCourse(courseId, this.userId).subscribe({
      next: () => {
        // Reload courses to update the UI
        this.loadCourses();
      },
      error: (error) => {
        console.error('Error enrolling in course:', error);
        this.errorMessage = 'No se pudo inscribir en el curso. Por favor intente de nuevo.';
        this.isLoading = false;
      }
    });
  }
}
