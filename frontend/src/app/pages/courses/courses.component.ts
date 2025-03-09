import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
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

    this.currentCourse = course;

    this.courseForm.patchValue({
      name: course.name,
      description: course.description,
      professorId: course.professorId,
    });

    if (course.scheduleId) {
      this.courseForm.get('schedule')?.patchValue({
        days: course.scheduleId.days,
        startTime: course.scheduleId.startTime,
        endTime: course.scheduleId.endTime,
        room: course.scheduleId.room,
        startDate: new Date(course.scheduleId.startDate)
          .toISOString()
          .split('T')[0],
        endDate: new Date(course.scheduleId.endDate)
          .toISOString()
          .split('T')[0],
      });
    }

    this.showEditModal = true;
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
          this.handleApiError(error, 'Error updating course');
          this.loading = false;
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
}
