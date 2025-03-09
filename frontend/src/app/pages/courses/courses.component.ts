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
  departments: Department[] = [];
  professors: Array<{ _id: string; name: string }> = [];

  // UI state
  loading = false;
  error = '';
  success = '';
  showCreateModal = false;
  showEditModal = false;
  showDeleteConfirm = false;

  // Filters
  searchTerm = '';
  selectedDepartment = '';

  // Selected course for edit/delete
  currentCourse: Course | null = null;

  // Form
  courseForm!: FormGroup;

  constructor(
    private courseService: CourseService,
    private departmentService: DepartmentService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated before proceeding
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.initCourseForm();
    this.loadCourses();
    this.loadDepartments();
    this.loadProfessors();

    // Check if we need to open the edit modal from URL parameters
    this.route.queryParams.subscribe((params) => {
      if (params['edit'] && this.canManageCourses) {
        // Find the course in the loaded courses
        const courseToEdit = this.courses.find((c) => c._id === params['edit']);
        if (courseToEdit) {
          this.openEditModal(courseToEdit);
        } else {
          // If the course is not yet loaded, fetch it directly
          this.courseService.getCourse(params['edit']).subscribe({
            next: (course) => {
              this.openEditModal(course);
            },
            error: (error) => {
              this.handleApiError(error, 'Error loading course to edit');
            },
          });
        }
      }
    });
  }

  initCourseForm(): void {
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
    this.courseService.getAllCourses().subscribe({
      next: (data: Course[]) => {
        this.courses = data;
        this.loading = false;
      },
      error: (error: any) => {
        this.handleApiError(error, 'Error loading courses');
        this.loading = false;
      },
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (data: Department[]) => {
        this.departments = data;
      },
      error: (error: any) => {
        this.handleApiError(error, 'Error loading departments');
      },
    });
  }

  loadProfessors(): void {
    this.userService.getAllProfessors().subscribe({
      next: (data: any[]) => {
        // Extract professor info from user objects
        this.professors = data.map((professor) => ({
          _id: professor._id,
          name: professor.name || professor.userId?.name || 'Unknown',
        }));
      },
      error: (error: any) => {
        this.handleApiError(error, 'Error loading professors');
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

  applyFilter(): void {
    if (!this.searchTerm) {
      // If no search term, load all courses
      this.loadCourses();
      return;
    }

    // Use the updated searchCourses method that filters locally
    this.loading = true;
    this.courseService.searchCourses(this.searchTerm).subscribe({
      next: (filteredCourses: Course[]) => {
        this.courses = filteredCourses;
        this.loading = false;
      },
      error: (error: any) => {
        this.handleApiError(error, 'Error filtering courses');
        this.loading = false;
      },
    });
  }

  // Since we have a dedicated search method, we can simplify the filteredCourses getter
  get filteredCourses(): Course[] {
    return this.courses;
  }

  // Extend resetFilters to reload all courses
  resetFilters(): void {
    this.searchTerm = '';
    this.loadCourses(); // Reload all courses when filters are reset
  }

  get canManageCourses(): boolean {
    return this.authService.isAdmin() || this.authService.isProfessor();
  }

  openCreateModal(): void {
    // Check authorization before allowing creation
    if (!this.canManageCourses) {
      this.error = 'You do not have permission to create courses';
      return;
    }

    this.courseForm.reset();
    this.courseForm.get('schedule')?.reset();
    this.showCreateModal = true;
  }

  openEditModal(course: Course): void {
    // Check authorization before allowing edit
    if (!this.canManageCourses) {
      this.error = 'You do not have permission to edit courses';
      return;
    }

    this.loading = true;

    // Fetch fresh course data from the server to ensure we have all details
    this.courseService.getCourse(course._id).subscribe({
      next: (fullCourse) => {
        this.currentCourse = fullCourse;

        // Fill the form with course data
        this.courseForm.patchValue({
          name: fullCourse.name,
          description: fullCourse.description,
          professorId: fullCourse.professorId,
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
    // Check authorization before allowing delete
    if (!this.canManageCourses) {
      this.error = 'You do not have permission to delete courses';
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
        formValue.professorId || null,
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

    if (formValue.professorId) {
      updateData.professorId = formValue.professorId;
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
   * Navigate to view a specific course
   */
  viewCourse(course: Course): void {
    this.router.navigate(['/courses', course._id]);
  }
}
