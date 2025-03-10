import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { EnrollmentService } from '../../../services/enrollment.service';
import { CourseService } from '../../../services/course.service';
import { AuthService } from '../../../services/auth.service';
import { Course } from '../../../models/course.model';
import { Enrollment, EnrollmentStatus } from '../../../models/enrollment.model';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-enrollment',
  templateUrl: './enrollment.component.html',
  styleUrls: ['./enrollment.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class EnrollmentComponent implements OnInit {
  // Student data
  userId: string = '';

  // Course lists
  availableCourses: Course[] = [];
  enrolledCourses: Enrollment[] = [];
  allCourses: Course[] = [];

  // Selected courses for batch enrollment
  selectedCourses: string[] = [];

  // Search filters
  searchQuery: string = '';
  filteredCourses: Course[] = [];

  // Loading states
  isLoading: boolean = false;
  isEnrolling: boolean = false;

  // Enrollment cycle status
  hasActiveEnrollmentCycle: boolean = false;

  // Local storage key for user ID
  private readonly USER_ID_KEY = 'app_user_id';

  constructor(
    private enrollmentService: EnrollmentService,
    private courseService: CourseService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    // Initialize the user ID and load data
    this.initializeUserId();
  }

  /**
   * Initialize user ID from authentication or local storage
   */
  initializeUserId(): void {
    // First try to get the ID from local storage
    const savedUserId = localStorage.getItem(this.USER_ID_KEY);

    if (savedUserId) {
      this.userId = savedUserId;
      console.log('User ID loaded from storage:', this.userId);
      this.loadData();
      return;
    }

    // Try to get directly from auth service
    const userData = this.authService.getCurrentUser();

    if (!userData) {
      console.error('No user is currently logged in');
      return;
    }

    // Extract the ID based on the User model which uses _id
    if (userData._id) {
      this.userId = userData._id;
      console.log('User ID loaded from auth service:', this.userId);
    }
    // Last resort - try to extract from access token
    else {
      const tokenUserId = this.getUserIdFromToken();
      if (tokenUserId) {
        this.userId = tokenUserId;
        console.log('User ID extracted from token:', this.userId);
      } else {
        console.error('User ID not found in auth data');
        return;
      }
    }

    // Save to local storage for persistence
    localStorage.setItem(this.USER_ID_KEY, this.userId);

    // Load data with the user ID
    this.loadData();
  }

  /**
   * Get JWT payload from token to extract user ID
   */
  private getUserIdFromToken(): string | null {
    try {
      // Get token from localStorage
      const token = localStorage.getItem('access_token');

      if (!token) return null;

      // Extract the payload part (second part of JWT)
      const parts = token.split('.');
      if (parts.length !== 3) return null;

      // Decode the payload
      const payload = JSON.parse(atob(parts[1]));

      // Return the subject (sub) which contains the user ID
      return payload.sub || null;
    } catch (error) {
      console.error('Error extracting user ID from token:', error);
      return null;
    }
  }

  /**
   * Load all required data
   */
  loadData(): void {
    // Ensure we have a valid user ID
    if (!this.userId || this.userId.trim() === '') {
      console.error('Cannot load data: User ID is missing or empty');

      // Try to initialize it again as a last resort
      const tokenUserId = this.getUserIdFromToken();
      if (tokenUserId) {
        this.userId = tokenUserId;
        localStorage.setItem(this.USER_ID_KEY, this.userId);
        console.log('User ID extracted from token as fallback:', this.userId);
      } else {
        return; // Can't proceed without an ID
      }
    }

    console.log('Loading data with user ID:', this.userId);
    this.isLoading = true;

    // First load all courses
    this.courseService.getAllCourses().subscribe({
      next: (courses) => {
        this.allCourses = courses;

        // Then load enrolled courses to filter out available ones
        this.loadEnrolledCourses().then(() => {
          this.filterAvailableCourses();
          this.isLoading = false;
        });
      },
      error: (error) => {
        console.error('Error loading all courses', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Load courses the student is enrolled in
   */
  loadEnrolledCourses(): Promise<void> {
    return new Promise((resolve) => {
      // Safety check for user ID
      if (!this.userId || this.userId.trim() === '') {
        console.error('Cannot load enrollments: User ID is missing or empty');
        resolve();
        return;
      }

      console.log('Loading enrollments for user ID:', this.userId);

      this.enrollmentService
        .getEnrollmentsByStudent(this.userId)
        .pipe(finalize(() => resolve()))
        .subscribe({
          next: (enrollments) => {
            console.log('Enrollments loaded:', enrollments.length);
            this.enrolledCourses = enrollments;

            // Check if student has any active enrollments (status = start)
            this.hasActiveEnrollmentCycle = enrollments.some(
              (enrollment) => enrollment.status === EnrollmentStatus.START,
            );
          },
          error: (error) => {
            console.error('Error loading enrolled courses:', error);
          },
        });
    });
  }

  /**
   * Filter available courses by removing enrolled ones
   */
  filterAvailableCourses(): void {
    // Get IDs of enrolled courses
    const enrolledCourseIds = this.enrolledCourses.map(
      (enrollment) => enrollment.courseId._id,
    );

    // Filter out enrolled courses from all courses
    this.availableCourses = this.allCourses.filter(
      (course) => !enrolledCourseIds.includes(course._id),
    );

    this.filteredCourses = [...this.availableCourses];
    this.applySearchFilter();
  }

  /**
   * Apply search filter to available courses
   */
  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredCourses = [...this.availableCourses];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredCourses = this.availableCourses.filter(
      (course) =>
        course.name.toLowerCase().includes(query) ||
        course.description.toLowerCase().includes(query),
    );
  }

  /**
   * Toggle course selection for enrollment
   */
  toggleCourseSelection(courseId: string): void {
    const index = this.selectedCourses.indexOf(courseId);
    if (index > -1) {
      this.selectedCourses.splice(index, 1);
    } else {
      this.selectedCourses.push(courseId);
    }
  }

  /**
   * Select all available courses
   */
  selectAllCourses(): void {
    if (this.hasActiveEnrollmentCycle) return;

    this.selectedCourses = this.filteredCourses.map((course) => course._id);
  }

  /**
   * Clear all course selections
   */
  clearSelection(): void {
    this.selectedCourses = [];
  }

  /**
   * Check if a course is selected
   */
  isCourseSelected(courseId: string): boolean {
    return this.selectedCourses.includes(courseId);
  }

  /**
   * Enroll in all selected courses
   */
  enrollInSelectedCourses(): void {
    if (this.selectedCourses.length === 0) {
      alert('Please select at least one course to enroll in.');
      return;
    }

    if (this.hasActiveEnrollmentCycle) {
      alert(
        'You already have active enrollments. Please finish your current enrollment cycle before adding new courses.',
      );
      return;
    }

    // Validate user ID
    if (!this.userId || this.userId.trim() === '') {
      console.error('Cannot enroll: User ID is missing or empty');
      alert('Your profile information is incomplete. Please log in again.');
      return;
    }

    this.isEnrolling = true;
    const today = new Date();
    const enrollmentStartDate = today.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    // Default end date 6 months from now
    const endDate = new Date(today);
    endDate.setMonth(endDate.getMonth() + 6);
    const enrollmentEndDate = endDate.toISOString().split('T')[0]; // Format: YYYY-MM-DD

    console.log(
      `Creating ${this.selectedCourses.length} enrollments for user ID:`,
      this.userId,
    );

    // Process enrollments one by one
    const enrollmentPromises = this.selectedCourses.map((courseId) => {
      return firstValueFrom(
        this.enrollmentService.createEnrollment(
          this.userId,
          courseId,
          enrollmentStartDate,
          enrollmentEndDate,
        ),
      );
    });

    // When all enrollments are complete
    Promise.all(enrollmentPromises)
      .then((results) => {
        console.log('Enrollments created successfully:', results.length);
        this.selectedCourses = []; // Clear selection
        this.loadData(); // Reload data
      })
      .catch((error) => {
        console.error('Error enrolling in courses:', error);
        alert('There was an error enrolling in courses. Please try again.');
      })
      .finally(() => {
        this.isEnrolling = false;
      });
  }

  /**
   * Remove an enrollment
   */
  removeEnrollment(courseId: string): void {
    if (!this.userId || this.userId.trim() === '') {
      console.error('Cannot remove enrollment: User ID is missing or empty');
      alert('Unable to identify your profile. Please log in again.');
      return;
    }

    if (confirm('Are you sure you want to remove this enrollment?')) {
      console.log(
        'Removing enrollment - User ID:',
        this.userId,
        'Course ID:',
        courseId,
      );

      this.enrollmentService.deleteEnrollment(this.userId, courseId).subscribe({
        next: () => {
          console.log('Enrollment removed successfully');
          this.loadData();
        },
        error: (error) => {
          console.error('Error removing enrollment:', error);
          alert(
            'There was an error removing the enrollment. Please try again.',
          );
        },
      });
    }
  }

  /**
   * Finish all enrollments in the current cycle
   */
  finishAllEnrollments(): void {
    if (!this.userId || this.userId.trim() === '') {
      console.error('Cannot finish enrollments: User ID is missing or empty');
      alert('Unable to identify your profile. Please log in again.');
      return;
    }

    if (
      confirm(
        'Are you sure you want to mark all enrollments as finished? This action cannot be undone.',
      )
    ) {
      console.log('Finishing enrollments for user ID:', this.userId);

      const activeEnrollments = this.enrolledCourses.filter(
        (enrollment) => enrollment.status === EnrollmentStatus.START,
      );

      if (activeEnrollments.length === 0) {
        alert('You have no active enrollments to complete.');
        return;
      }

      console.log(
        `Marking ${activeEnrollments.length} enrollments as finished`,
      );

      const finishPromises = activeEnrollments.map((enrollment) => {
        return firstValueFrom(
          this.enrollmentService.updateEnrollmentStatus(
            this.userId,
            enrollment.courseId._id,
            EnrollmentStatus.FINISH,
            new Date().toISOString().split('T')[0], // Format: YYYY-MM-DD
          ),
        );
      });

      Promise.all(finishPromises)
        .then((results) => {
          console.log('Enrollments finished successfully:', results.length);
          this.loadData(); // Reload data
        })
        .catch((error) => {
          console.error('Error finishing enrollments:', error);
          alert(
            'There was an error finishing one or more enrollments. Please try again.',
          );
        });
    }
  }
}
