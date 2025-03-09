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
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.loadCourses();
    this.loadProfessors();

    // Check for the edit query parameter
    this.route.queryParams
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
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
    this.loading = true;

    this.courseService
      .getAllCourses()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (courses) => {
          this.courses = courses;
          console.log('Courses:', courses);
          this.filteredCourses = [...courses];
          this.loading = false;
        },
        error: (error: any) => {
          this.showAlert('Error loading courses: ' + error.message, 'danger');
          this.loading = false;
        },
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
          // Extract the user data from the nested structure
          this.professors = professors.map((prof: Professor) => ({
            value: prof.userId._id,
            label: prof.userId.name || prof.userId.username,
          }));
        },
        error: (error: any) => {
          console.error('Error loading professors', error);
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
    console.log('Opening edit modal for course:', course);

    // Fetch complete course details to ensure we have all data
    this.courseService.getCourse(course._id).subscribe({
      next: (completeData) => {
        console.log('Got complete course data for editing:', completeData);

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
  onViewCourse(courseId: string): void {
    this.router.navigate(['/courses', courseId]);
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
  onDeleteCourse(courseId: string): void {
    const course = this.courses.find((c) => c._id === courseId);
    if (course) {
      this.openDeleteModal(course);
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
}
