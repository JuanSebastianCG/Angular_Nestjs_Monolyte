import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';

// Models
import { Course } from '../../../models/course.model';
import { User } from '../../../models/user.model';
import { Professor } from '../../../models/professor.model';

// Services
import { CourseService } from '../../../services/course.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';

// Components
import { CourseCardComponent } from '../../../components/course-card/course-card.component';
import { CourseFormComponent } from '../../../components/course-form/course-form.component';
import { ModalComponent } from '../../../components/modal/modal.component';
import { AlertComponent } from '../../../components/alert/alert.component';

// Define the AlertType type
type AlertType = 'info' | 'success' | 'danger' | 'warning';

@Component({
  selector: 'app-course-list',
  templateUrl: './course-list.component.html',
  styleUrls: ['./course-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    CourseCardComponent,
    CourseFormComponent,
    ModalComponent,
    AlertComponent,
  ],
})
export class CourseListComponent implements OnInit, OnDestroy {
  // Course data
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  selectedCourse: Course | null = null;

  // UI state
  loading = false;
  showCreateModal = false;
  showEditModal = false;
  showDeleteModal = false;
  showViewModal = false;

  // Filtering
  searchQuery = '';
  selectedDay = '';
  currentView: 'all' | 'my' = 'all';

  // Form data
  professors: { value: string; label: string }[] = [];

  // Alerts
  alert = {
    show: false,
    message: '',
    type: 'info' as AlertType,
  };

  // For cleanup
  private destroy$ = new Subject<void>();

  constructor(
    private courseService: CourseService,
    private userService: UserService,
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadProfessors();

    // Check for query params (active tab or edit mode)
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        // Check if 'view' parameter is present (all or my)
        if (params['view'] === 'my' && this.authService.isProfessor()) {
          this.currentView = 'my';
          this.loadMyCoursesOnly();
        } else {
          this.currentView = 'all';
          this.loadAllCourses();
        }

        // Check for edit parameter
        const courseId = params['edit'];
        if (courseId) {
          this.courseService.getCourse(courseId).subscribe({
            next: (course) => {
              this.openEditModal(course);
              // Remove the query param after opening the modal
              this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { edit: null },
                queryParamsHandling: 'merge',
              });
            },
            error: (error) => {
              this.showAlert(
                'Error loading course for editing: ' + error.message,
                'danger',
              );
            },
          });
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load all courses
   */
  loadCourses(): void {
    // Determine which courses to load based on the current view
    if (this.currentView === 'my' && this.authService.isProfessor()) {
      this.loadMyCoursesOnly();
    } else {
      this.loadAllCourses();
    }
  }

  /**
   * Load all courses without filtering
   */
  loadAllCourses(): void {
    this.loading = true;

    this.courseService
      .getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          this.filteredCourses = [...courses];
          this.loading = false;
          console.log("Cargados All Courses:", courses.length);
        },
        error: (error: any) => {
          this.showAlert('Error loading courses: ' + error.message, 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Load only courses assigned to the current professor
   */
  loadMyCoursesOnly(): void {
    if (!this.authService.isProfessor()) {
      return this.loadAllCourses();
    }

    this.loading = true;
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser || !currentUser._id) {
      this.loading = false;
      this.showAlert('Error: No user data available', 'danger');
      return;
    }

    console.log("Loading courses for professor ID:", currentUser._id);
    
    // Get all courses and filter client-side - this is more reliable
    this.courseService
      .getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (allCourses) => {
          console.log(`Received ${allCourses.length} courses from API`);
          
          // Filter courses where the professor ID matches the current user ID
          const myCourses = allCourses.filter(course => this.canManageCourse(course));
          
          this.courses = myCourses;
          this.filteredCourses = [...myCourses];
          this.loading = false;
          console.log(`Filtered to ${myCourses.length} courses belonging to the current professor`);
        },
        error: (error: any) => {
          this.showAlert('Error loading your courses: ' + error.message, 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Toggle between all courses and my courses views
   */
  toggleView(view: 'all' | 'my'): void {
    if (this.currentView === view) return;
    
    this.currentView = view;
    this.loadCourses();
    
    // Update URL to reflect the current view
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { view },
      queryParamsHandling: 'merge',
    });
  }

  /**
   * Load professors for the form
   * Using the correct API endpoint /professors/
   */
  loadProfessors(): void {
    this.userService
      .getAllProfessors()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (professors: Professor[]) => {
          console.log("Datos de profesores recibidos:", professors);
          
          // Extract the user data from the nested structure
          // Es importante usar el ID de usuario, no el ID de profesor
          this.professors = professors.map((prof: Professor) => {
            // Verificar que prof.userId es un objeto
            if (prof.userId && typeof prof.userId === 'object') {
              return {
                value: prof.userId._id, // Usar el ID del USUARIO, no el ID del profesor
                label: prof.userId.name || prof.userId.username || 'Unknown',
              };
            }
            // Fallback en caso de estructura inesperada
            return {
              value: typeof prof._id === 'string' ? prof._id : 'unknown-id',
              label: 'Unknown Professor'
            };
          });
          
          console.log("Opciones de profesores preparadas:", this.professors);
        },
        error: (error: any) => {
          console.error('Error loading professors', error);
          this.showAlert('Error loading professors. Please try again.', 'danger');
        },
      });
  }

  /**
   * Apply search filter to courses
   */
  applyFilters(): void {
    this.filteredCourses = this.courses.filter((course) => {
      // Only apply name search
      const nameMatch =
        !this.searchQuery ||
        course.name.toLowerCase().includes(this.searchQuery.toLowerCase());

      return nameMatch;
    });
  }

  /**
   * Reset filters to their default values
   */
  resetFilters(): void {
    this.searchQuery = '';
    this.applyFilters();
  }

  /**
   * Handle search input changes
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Get the name of a prerequisite course
   */
  getPrerequisiteName(prereq: any): string {
    // Check if the prerequisite has a course name directly
    if (prereq.name) {
      return prereq.name;
    }

    // Check if the prerequisite has a prerequisiteCourseId with a name
    if (prereq.prerequisiteCourseId && prereq.prerequisiteCourseId.name) {
      return prereq.prerequisiteCourseId.name;
    }

    // Check if it's just a string ID reference
    if (typeof prereq === 'string') {
      return 'Course ID: ' + prereq;
    }

    return 'Unknown prerequisite';
  }

  /**
   * Open create course modal
   */
  openCreateModal(): void {
    this.selectedCourse = null;
    this.showCreateModal = true;
  }

  /**
   * Close create course modal
   */
  closeCreateModal(): void {
    this.showCreateModal = false;
  }

  /**
   * Open edit course modal with complete course data
   */
  openEditModal(course: Course): void {
    this.loading = true;

    // Fetch complete course details to ensure we have all data
    this.courseService.getCourse(course._id).subscribe({
      next: (completeData) => {
        // Make sure we have a clean form before setting the course
        this.selectedCourse = null;

        // Use setTimeout to ensure the change detection cycle completes
        setTimeout(() => {
          this.selectedCourse = completeData;
          this.showEditModal = true;
          this.loading = false;
        }, 0);
      },
      error: (error) => {
        console.error('Error fetching course details:', error);
        // Fallback to using the summary data we already have
        this.selectedCourse = course;
        this.showEditModal = true;
        this.loading = false;

        this.showAlert(
          'Could not fetch complete course details. Some fields may be missing.',
          'warning',
        );
      },
    });
  }

  /**
   * Close edit course modal
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.selectedCourse = null;
  }

  /**
   * Open delete confirmation modal
   */
  openDeleteModal(course: Course): void {
    this.selectedCourse = course;
    this.showDeleteModal = true;
  }

  /**
   * Close delete confirmation modal
   */
  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.selectedCourse = null;
  }

  /**
   * Navigate to the detailed view of a course
   */
  onViewCourse(course: Course): void {
    console.log("Navegando al detalle del curso:", course);
    if (course && course._id) {
      this.router.navigate(['/courses', course._id]);
    } else {
      console.error("Error: Curso inválido o sin ID", course);
      this.showAlert('Error: No se puede ver el curso seleccionado', 'danger');
    }
  }

  /**
   * Handle card edit action
   */
  onEditCourse(course: Course): void {
    this.openEditModal(course);
  }

  /**
   * Handle card delete action
   */
  onDeleteCourse(course: Course): void {
    console.log("Procesando eliminación del curso:", course);
    if (course && course._id) {
      this.openDeleteModal(course);
    } else {
      console.error("Error: Curso inválido o sin ID para eliminar", course);
      this.showAlert('Error: No se puede eliminar el curso seleccionado', 'danger');
    }
  }

  /**
   * Create a new course
   */
  createCourse(formData: any): void {
    this.loading = true;

    const { name, description, professorId, schedule } = formData;

    this.courseService
      .createCourse(name, description, professorId, schedule)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (newCourse) => {
          this.courses = [...this.courses, newCourse];
          this.applyFilters();
          this.closeCreateModal();
          this.showAlert('Course created successfully!', 'success');
          this.loading = false;
        },
        error: (error) => {
          this.showAlert('Error creating course: ' + error.message, 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Update an existing course
   */
  updateCourse(formData: any): void {
    if (!this.selectedCourse) return;

    this.loading = true;

    this.courseService
      .updateCourse(this.selectedCourse._id, formData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (updatedCourse) => {
          // Update course in the array
          this.courses = this.courses.map((course) =>
            course._id === updatedCourse._id ? updatedCourse : course,
          );
          this.applyFilters();
          this.closeEditModal();
          this.showAlert('Course updated successfully!', 'success');
          this.loading = false;
        },
        error: (error) => {
          this.showAlert('Error updating course: ' + error.message, 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Delete a course
   */
  confirmDeleteCourse(): void {
    if (!this.selectedCourse) return;

    this.loading = true;

    this.courseService
      .deleteCourse(this.selectedCourse._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Remove course from the array
          this.courses = this.courses.filter(
            (course) => course._id !== this.selectedCourse?._id,
          );
          this.applyFilters();
          this.closeDeleteModal();
          this.showAlert('Course deleted successfully!', 'success');
          this.loading = false;
        },
        error: (error) => {
          this.showAlert('Error deleting course: ' + error.message, 'danger');
          this.loading = false;
        },
      });
  }

  /**
   * Show alert message
   */
  showAlert(message: string, type: AlertType = 'info'): void {
    this.alert = {
      show: true,
      message,
      type,
    };

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      this.dismissAlert();
    }, 5000);
  }

  /**
   * Dismiss alert message
   */
  dismissAlert(): void {
    this.alert.show = false;
  }

  /**
   * Check if user is admin or professor
   */
  get canManageCourses(): boolean {
    let canManage = false;
    this.authService.currentUser$
      .subscribe((user) => {
        if (user) {
          canManage = user.role === 'admin' || user.role === 'professor';
        }
      })
      .unsubscribe();

    return canManage;
  }

  /**
   * Check if user can manage a specific course
   * Admins can manage all courses, professors only their own
   */
  canManageCourse(course: Course): boolean {
    const currentUser = this.authService.getCurrentUser();
    
    if (!currentUser) return false;
    
    // Admins can manage all courses
    if (currentUser.role === 'admin') {
      return true;
    }
    
    // Professors can only manage their own courses
    if (currentUser.role === 'professor') {
      // La estructura según la API: "professorId": { "_id": "67cdcc42ceb9d047ce5d57ac", "name": "Professor Name", ... }
      if (typeof course.professorId === 'object' && course.professorId) {
        const prof = course.professorId as any;
        
        // Comparar directamente con el _id del objeto profesor
        if (prof._id) {
          const isMatch = currentUser._id === prof._id;
          return isMatch;
        }
      } 
      // Si por alguna razón professorId es un string (ID sin populate)
      else if (typeof course.professorId === 'string') {
        return currentUser._id === course.professorId;
      }
    }
    
    return false;
  }

  /**
   * Get the count of courses owned by the current professor
   */
  get ownCoursesCount(): number {
    if (!this.authService.isProfessor() || !this.courses) {
      return 0;
    }
    
    return this.courses.filter(course => this.canManageCourse(course)).length;
  }
}
