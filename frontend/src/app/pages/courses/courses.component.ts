import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Course } from '../../models/course.model';
import { Department } from '../../models/department.model';
import { Schedule } from '../../models/schedule.model';
import { Professor } from '../../models/professor.model';

// Import services
import { CourseService } from '../../services/course.service';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

// Import shared components
import { AlertComponent } from '../../components/alert/alert.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { AppButtonComponent } from '../../components/app-button/app-button.component';
import { CourseCardComponent } from '../../components/course-card/course-card.component';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    RouterModule,
    AlertComponent,
    ModalComponent,
    FormFieldComponent,
    AppButtonComponent,
    CourseCardComponent,
  ],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss'],
})
export class CoursesComponent implements OnInit {
  // Course data
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  departments: Department[] = [];
  professors: Array<{ _id: string; name: string }> = [];
  
  // Nuevas propiedades para las opciones de los selectores
  departmentOptions: Array<{ value: string; label: string }> = [];
  professorOptions: Array<{ value: string; label: string }> = [];
  
  // Vista actual: 'all' para All Courses, 'my' para My Courses
  currentView: 'all' | 'my' = 'all';

  // Form
  courseForm!: FormGroup;

  // Estado de UI
  loading = false;
  error = '';
  success = '';
  searchTerm = '';
  selectedDepartment = '';
  currentCourse: Course | null = null;
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private route: ActivatedRoute,
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private userService: UserService,
    public authService: AuthService
  ) {
    // Iniciar el modo de depuración para rastrear problemas
    console.log('DEBUG: CoursesComponent inicializado');
    console.log('DEBUG: Usuario actual:', this.authService.getCurrentUser());
  }

  ngOnInit(): void {
    // Initialize form
    this.initForm();

    // Check for query params (for filter)
    this.route.queryParams.subscribe(params => {
      if (params['view'] === 'my' && this.authService.isProfessor()) {
        this.currentView = 'my';
        console.log('Vista establecida a "My Courses" por parámetro URL');
      } else if (this.authService.isProfessor() && !this.authService.isAdmin()) {
        // Por defecto, mostrar "My Courses" para profesores no administradores
        this.currentView = 'my';
        console.log('Vista establecida a "My Courses" por defecto para profesor');
      } else {
        this.currentView = 'all';
        console.log('Vista establecida a "All Courses"');
      }
      
      // Load initial data
      this.loadCourses();
      this.loadDepartments();
      this.loadProfessors();
    });
  }

  // Cambiar entre vista de All Courses y My Courses
  toggleView(view: 'all' | 'my'): void {
    this.currentView = view;
    this.applyFilter();
  }

  // Verificar si el curso pertenece al profesor actual
  isOwnCourse(course: Course): boolean {
    if (!this.authService.isProfessor()) {
      return false;
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser || !currentUser._id) {
      return false;
    }
    
    console.log(`Checking if course "${course.name}" belongs to professor ${currentUser._id}`);
    
    try {
      // Caso: professorId es un objeto (respuesta API con populate)
      if (typeof course.professorId === 'object' && course.professorId) {
        const prof = course.professorId as any;
        
        // La API devuelve directamente el objeto User como professorId
        // El ejemplo: "professorId": { "_id": "67cdcc42ceb9d047ce5d57ac", "name": "Professor Name", ... }
        if (prof._id) {
          const isMatch = currentUser._id === prof._id;
          console.log(`Comparing with User ID directly: ${currentUser._id} vs ${prof._id} = ${isMatch}`);
          return isMatch;
        }
      } 
      // Caso: professorId es un string (ID sin populate)
      else if (typeof course.professorId === 'string') {
        const isMatch = currentUser._id === course.professorId;
        console.log(`Comparing with string ID: ${currentUser._id} vs ${course.professorId} = ${isMatch}`);
        return isMatch;
      }
    } catch (err) {
      console.error('Error checking course ownership:', err);
    }
    
    return false;
  }

  // Aplicar filtros y actualizar vista
  applyFilter(): void {
    console.log('Aplicando filtros con vista:', this.currentView);
    console.log('Cursos disponibles:', this.courses.length);
    
    let filtered = [...this.courses];
    
    // Filtrar por término de búsqueda
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(course => 
        course.name.toLowerCase().includes(term) || 
        course.description.toLowerCase().includes(term)
      );
      console.log(`Después del filtro por búsqueda: ${filtered.length} cursos`);
    }
    
    // Filtrar por departamento
    if (this.selectedDepartment) {
      filtered = filtered.filter(course => {
        if (typeof course.professorId === 'object') {
          // Si el departamento está anidado en el profesor
          const professor = course.professorId as any;
          return professor?.departmentId?._id === this.selectedDepartment;
        }
        return false;
      });
      console.log(`Después del filtro por departamento: ${filtered.length} cursos`);
    }
    
    // Filtrar por "My Courses" si estamos en esa vista
    if (this.currentView === 'my' && this.authService.isProfessor()) {
      console.log('Filtrando solo My Courses...');
      const currentUser = this.authService.getCurrentUser();
      console.log('Usuario actual:', currentUser?._id);
      
      const beforeFilter = filtered.length;
      filtered = filtered.filter(course => {
        const isOwn = this.isOwnCourse(course);
        console.log(`Curso ${course.name}: ¿es propio? ${isOwn}`);
        return isOwn;
      });
      
      console.log(`Después del filtro 'My Courses': ${filtered.length} cursos (eliminados ${beforeFilter - filtered.length})`);
      
      // Si no hay cursos propios, mostrar mensaje
      if (filtered.length === 0) {
        console.warn('¡IMPORTANTE! No se encontraron cursos propios para este profesor.');
      }
    }
    
    this.filteredCourses = filtered;
    console.log('Filtrado finalizado, cursos mostrados:', this.filteredCourses.length);
  }

  initForm(): void {
    this.courseForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.required, Validators.maxLength(500)]],
      professorId: [''],
      schedule: this.formBuilder.group({
        days: [[], [Validators.required]],
        startTime: ['', [Validators.required]],
        endTime: ['', [Validators.required]],
        room: ['', [Validators.required]],
        startDate: ['', [Validators.required]],
        endDate: ['', [Validators.required]],
      }),
    });
  }

  loadCourses(): void {
    this.loading = true;
    this.error = '';
    
    console.log('Cargando cursos desde API...');
    
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
        console.log(`Cursos cargados: ${courses.length}`);
        
        // Depurar la estructura de cada curso para identificar problemas
        courses.forEach((course, index) => {
          if (index < 3) { // Solo para los primeros 3 cursos para no saturar la consola
            this.debugCourseStructure(course);
          }
        });
        
        this.applyFilter(); // Aplica los filtros actuales, incluyendo la vista de "My Courses"
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Error al cargar los cursos. Por favor, inténtalo de nuevo.';
        console.error('Error loading courses:', error);
        this.loading = false;
      }
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments: Department[]) => {
        this.departments = departments;
        // Crear opciones para el selector
        this.departmentOptions = this.departments.map(d => ({ 
          value: d._id, 
          label: d.name 
        }));
      },
      error: (error: any) => {
        console.error('Error loading departments', error);
      },
    });
  }

  loadProfessors(): void {
    this.userService.getAllProfessors().subscribe({
      next: (professors: Professor[]) => {
        console.log("Profesores obtenidos de la API:", professors);
        
        // Mapear correctamente profesores para incluir todos los disponibles
        this.professors = professors.map(p => {
          // Asegurarse de que estamos usando el ID del USUARIO, no el de la tabla professor
          if (p.userId && typeof p.userId === 'object') {
            return {
              _id: p.userId._id, // Usamos el ID del usuario del profesor
              name: p.userId.name || p.userId.username || 'Unknown'
            };
          }
          // Fallback por si acaso
          return { 
            _id: typeof p._id === 'string' ? p._id : 'unknown-id', 
            name: 'Unknown Professor' 
          };
        });
        
        // Crear opciones para el selector
        this.professorOptions = this.professors.map(p => ({ 
          value: p._id, 
          label: p.name 
        }));
        
        console.log('Profesores procesados para el formulario:', this.professorOptions);
      },
      error: (error: any) => {
        console.error('Error loading professors', error);
        this.error = 'Error al cargar los profesores. Por favor, inténtalo de nuevo.';
      },
    });
  }

  // Handle API errors without using refresh token
  private handleApiError(error: any, defaultMessage: string): void {
    console.error(defaultMessage, error);

    // Check for authentication errors (401)
    if (error.status === 401) {
      this.error = 'Authentication error. Please log in again.';
      // Redirect to login after a short delay
      setTimeout(() => {
        this.authService.logout().subscribe({
          next: () => {
            this.router.navigate(['/login']);
          },
          error: () => {
            // Even if logout fails, still redirect to login
            this.router.navigate(['/login']);
          },
        });
      }, 2000);
    } else {
      // Handle other errors
      this.error = `${defaultMessage}: ${error.message || 'Unknown error'}`;
    }
  }

  get canManageCourses(): boolean {
    return this.authService.isAdmin() || this.authService.isProfessor();
  }

  // Determinar si un curso específico puede ser editado por el usuario actual
  canManageCourse(course: Course): boolean {
    // Los administradores pueden editar cualquier curso
    if (this.authService.isAdmin()) return true;
    
    // Los profesores solo pueden editar sus propios cursos
    if (this.authService.isProfessor()) {
      const isOwner = this.isOwnCourse(course);
      console.log(`¿Puede gestionar el curso ${course.name}? ${isOwner}`);
      return isOwner;
    }
    
    return false;
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedDepartment = '';
    this.applyFilter();
  }

  openCreateModal(): void {
    // Verificar permisos antes de permitir la creación
    if (!this.canManageCourses) {
      this.error = 'No tienes permiso para crear cursos';
      return;
    }

    // Resetear el formulario
    this.courseForm.reset();
    this.courseForm.get('schedule')?.reset();
    
    // Si es un profesor, preseleccionar su ID en el formulario
    if (this.authService.isProfessor() && !this.authService.isAdmin()) {
      const currentUser = this.authService.getCurrentUser();
      if (currentUser && currentUser._id) {
        // Asignar al profesor actual como profesor del curso
        this.courseForm.patchValue({
          professorId: currentUser._id
        });
        
        // Si estamos en "My Courses", deshabilitar el cambio de profesor
        if (this.currentView === 'my') {
          this.courseForm.get('professorId')?.disable();
        }
      }
    }
    
    this.showCreateModal = true;
  }

  openEditModal(course: Course): void {
    // Verificar permisos para editar este curso específico
    if (!this.canManageCourse(course)) {
      this.error = 'No tienes permiso para editar este curso';
      return;
    }

    this.loading = true;
    console.log(`Abriendo modal de edición para curso: ${course.name}`);

    // Fetch fresh course data from the server to ensure we have all details
    this.courseService.getCourse(course._id).subscribe({
      next: (fullCourse) => {
        this.currentCourse = fullCourse;
        console.log('Curso completo cargado:', fullCourse);

        // Fill the form with course data
        this.courseForm.patchValue({
          name: fullCourse.name,
          description: fullCourse.description,
          professorId: typeof fullCourse.professorId === 'object' ? 
                      (fullCourse.professorId as any)._id : 
                      fullCourse.professorId,
        });

        if (fullCourse.scheduleId) {
          try {
            this.courseForm.get('schedule')?.patchValue({
              days: fullCourse.scheduleId.days,
              startTime: fullCourse.scheduleId.startTime,
              endTime: fullCourse.scheduleId.endTime,
              room: fullCourse.scheduleId.room,
              startDate: new Date(fullCourse.scheduleId.startDate)
                .toISOString()
                .split('T')[0],
              endDate: new Date(fullCourse.scheduleId.endDate)
                .toISOString()
                .split('T')[0],
            });
          } catch (error) {
            console.error('Error formatting dates:', error);
          }
        }

        this.loading = false;
        this.showEditModal = true;
      },
      error: (error) => {
        this.handleApiError(error, 'Error loading course details for editing');
        this.loading = false;
      },
    });
  }

  confirmDelete(course: Course): void {
    // Verificar permisos antes de permitir eliminar
    if (!this.canManageCourse(course)) {
      this.error = 'No tienes permiso para eliminar este curso';
      return;
    }

    this.currentCourse = course;
    this.showDeleteConfirm = true;
  }

  closeModals(): void {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.showDeleteConfirm = false;
    this.currentCourse = null;
  }

  createCourse(): void {
    if (this.courseForm.invalid) {
      return;
    }

    this.loading = true;
    const formValue = this.courseForm.value;
    
    console.log("Formulario enviado:", formValue);
    console.log("ID de profesor seleccionado:", formValue.professorId);

    // Prepare dates in the correct format
    if (formValue.schedule) {
      // Ensure dates are in the correct format (YYYY-MM-DD)
      if (formValue.schedule.startDate) {
        formValue.schedule.startDate = this.formatDateForApi(
          formValue.schedule.startDate,
        );
      }
      if (formValue.schedule.endDate) {
        formValue.schedule.endDate = this.formatDateForApi(
          formValue.schedule.endDate,
        );
      }
    }

    // Call the service with the correct parameters
    this.courseService
      .createCourse(
        formValue.name,
        formValue.description,
        formValue.professorId || null, // Este ID debería ser el ID de usuario
        formValue.schedule,
      )
      .subscribe({
        next: () => {
          this.success = 'Course created successfully';
          this.loading = false;
          this.loadCourses();
          this.closeModals();
        },
        error: (error: any) => {
          this.handleApiError(error, 'Error creating course');
          this.loading = false;
        },
      });
  }

  updateCourse(): void {
    if (this.courseForm.invalid || !this.currentCourse) {
      // Mark all fields as touched to trigger validation messages
      this.courseForm.markAllAsTouched();
      // Show error message
      this.error = 'Please fill out all required fields correctly.';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    const formValue = this.courseForm.value;
    
    console.log("Actualizando curso con datos:", formValue);
    console.log("ID de profesor seleccionado para actualización:", formValue.professorId);

    // Prepare dates in the correct format
    if (formValue.schedule) {
      // Ensure dates are in the correct format (YYYY-MM-DD)
      if (formValue.schedule.startDate) {
        formValue.schedule.startDate = this.formatDateForApi(
          formValue.schedule.startDate,
        );
      }
      if (formValue.schedule.endDate) {
        formValue.schedule.endDate = this.formatDateForApi(
          formValue.schedule.endDate,
        );
      }
    }

    const updateData: any = {
      name: formValue.name,
      description: formValue.description,
      schedule: formValue.schedule,
    };

    // Solo incluir el professorId si está definido
    if (formValue.professorId) {
      updateData.professorId = formValue.professorId; // Este es el ID de usuario
    }

    this.courseService
      .updateCourse(this.currentCourse._id, updateData)
      .subscribe({
        next: () => {
          this.success = 'Course updated successfully';
          this.loading = false;
          this.loadCourses();
          this.closeModals();
        },
        error: (error: any) => {
          this.loading = false;

          // Get the specific error message from the Error object
          if (error instanceof Error) {
            this.error = error.message;
          } else {
            this.handleApiError(error, 'Error updating course');
          }
        },
      });
  }

  deleteCourse(): void {
    if (!this.currentCourse) {
      return;
    }

    this.loading = true;

    this.courseService.deleteCourse(this.currentCourse._id).subscribe({
      next: () => {
        this.success = 'Course deleted successfully';
        this.loading = false;
        this.loadCourses();
        this.closeModals();
      },
      error: (error: any) => {
        this.handleApiError(error, 'Error deleting course');
        this.loading = false;
      },
    });
  }

  formatDateForApi(dateString: string): string {
    // Ensure date is in YYYY-MM-DD format for the API
    if (!dateString) return '';

    try {
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch (e) {
      console.error('Error formatting date', e);
      return dateString;
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

  formatTime(time: string): string {
    return time;
  }

  getProfessorName(professorId: string): string {
    const professor = this.professors.find((p) => p._id === professorId);
    return professor ? professor.name : 'Not assigned';
  }

  formatDays(days: string[]): string {
    return days.join(', ');
  }

  clearMessages(): void {
    this.error = '';
    this.success = '';
  }

  /**
   * Navegar para ver un curso específico
   */
  viewCourse(course: Course): void {
    this.router.navigate(['/courses', course._id]);
  }

  // Obtener el número de cursos propios del profesor
  get ownCoursesCount(): number {
    return this.courses.filter(course => this.isOwnCourse(course)).length;
  }

  // Método de depuración para inspeccionar la estructura del profesor
  debugCourseStructure(course: Course): void {
    console.log('DEBUG: Estructura del curso:', course.name);
    console.log('DEBUG: ID del curso:', course._id);
    console.log('DEBUG: Tipo de professorId:', typeof course.professorId);
    
    if (typeof course.professorId === 'object') {
      const prof = course.professorId as any;
      console.log('DEBUG: Estructura completa del profesor:', prof);
      console.log('DEBUG: ID del profesor (objeto):', prof._id);
      if (prof.userId) {
        console.log('DEBUG: Tiene userId anidado:', prof.userId);
      }
    } else {
      console.log('DEBUG: ID del profesor (string):', course.professorId);
    }
    
    const currentUser = this.authService.getCurrentUser();
    if (currentUser) {
      console.log('DEBUG: Usuario actual ID:', currentUser._id);
    }
  }
}
