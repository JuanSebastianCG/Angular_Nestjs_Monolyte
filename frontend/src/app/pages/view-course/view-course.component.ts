import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, catchError, of } from 'rxjs';
import { CourseService } from '../../services/course.service';
import { UserService } from '../../services/user.service';
import { Course, CourseJustId } from '../../models/course.model';
import { Prerequisite } from '../../models/prerequisite.model';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-view-course',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './view-course.component.html',
  styleUrls: ['./view-course.component.scss'],
})
export class ViewCourseComponent implements OnInit, OnDestroy {
  course: Course | null = null;
  loading = true;
  error = '';

  // Professor data
  professorName: string = 'Not assigned';
  loadingProfessor = false;

  // Active tab
  activeTab: 'students' | 'exams' | 'grades' = 'exams';

  // Exams (placeholder for future functionality)
  exams: any[] = [
    {
      name: 'Nombre Examen',
      description: 'description',
      maxGrade: 5.0,
      date: '00/00/00',
    },
    {
      name: 'Nombre Examen',
      description: 'description',
      maxGrade: 5.0,
      date: '00/00/00',
    },
  ];

  private destroy$ = new Subject<void>();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private userService: UserService,
    private authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadCourse();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load course details from the API
   */
  loadCourse(): void {
    this.loading = true;
    this.error = '';

    const courseId = this.route.snapshot.paramMap.get('id');

    if (!courseId) {
      this.error = 'Course ID not found';
      this.loading = false;
      return;
    }

    console.log('Loading course with ID:', courseId);

    this.courseService
      .getCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.course = course;
          this.loading = false;
          console.log('Course loaded successfully:', course);

          // Log the prerequisites for debugging
          if (course.prerequisites && course.prerequisites.length > 0) {
            console.log('Prerequisites:', course.prerequisites);
            console.log(
              'Formatted prerequisites:',
              this.getPrerequisitesText(),
            );
          }

          // Load professor data if available
          if (course.professorId) {
            this.loadProfessorData(course.professorId);
          }
        },
        error: (error) => {
          console.error('Error loading course:', error);
          this.error = 'Failed to load course. Please try again.';
          this.loading = false;
        },
      });
  }

  /**
   * Load professor data using UserService
   */
  loadProfessorData(professorId: string): void {
    this.loadingProfessor = true;

    this.userService
      .getUserById(professorId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading professor:', error);
          return of(null);
        }),
        finalize(() => (this.loadingProfessor = false)),
      )
      .subscribe((user) => {
        if (user) {
          // Use appropriate user properties for display name
          this.professorName =
            user.name || user.username || user.email || 'Unknown';
        } else {
          this.professorName = 'Not available';
        }
      });
  }

  /**
   * Set the active tab
   */
  setActiveTab(tab: 'students' | 'exams' | 'grades'): void {
    this.activeTab = tab;
  }

  /**
   * Format days of the week
   */
  formatDays(days: string[] | undefined): string {
    if (!days || days.length === 0) return 'N/A';
    return days.join(', ');
  }

  /**
   * Get prerequisite courses as formatted string
   */
  getPrerequisitesText(): string {
    if (!this.course?.prerequisites || this.course.prerequisites.length === 0) {
      return 'None';
    }

    return this.course.prerequisites
      .map((prereq) => {
        // Handle different prerequisite formats
        try {
          // If the prerequisite is a string
          if (typeof prereq === 'string') return prereq;

          // If it has the prerequisiteCourseId property
          if ('prerequisiteCourseId' in prereq) {
            // If prerequisiteCourseId is an object with name property
            if (
              typeof prereq.prerequisiteCourseId === 'object' &&
              prereq.prerequisiteCourseId !== null &&
              'name' in prereq.prerequisiteCourseId
            ) {
              return prereq.prerequisiteCourseId.name;
            }
            // If prerequisiteCourseId is a string
            if (typeof prereq.prerequisiteCourseId === 'string') {
              return prereq.prerequisiteCourseId;
            }
          }

          // If it's a complete course object (not a Prerequisite type)
          // We need to use type assertion here because TypeScript doesn't know
          // that some prerequisites might be Course objects
          const coursePrereq = prereq as unknown as {
            name?: string;
            _id?: string;
          };
          if (coursePrereq._id && coursePrereq.name) {
            return coursePrereq.name;
          }

          return 'Unknown prerequisite';
        } catch (error) {
          console.error('Error formatting prerequisite:', error, prereq);
          return 'Unknown prerequisite';
        }
      })
      .join(', ');
  }

  /**
   * Check if the current user is the course professor or an admin
   */
  get canManageCourse(): boolean {
    if (!this.course || !this.authService.isAuthenticated()) return false;

    // Admin can manage any course
    if (this.authService.isAdmin()) return true;

    // Professor can manage their own courses
    if (this.authService.isProfessor()) {
      const currentUser = this.authService.getCurrentUser();
      return currentUser?._id === this.course.professorId;
    }

    return false;
  }

  /**
   * Navigate back to courses list
   */
  goBack(): void {
    this.router.navigate(['/courses']);
  }

  /**
   * Navigate to courses page with edit modal open for this course
   */
  editCourse(): void {
    if (!this.course) return;

    // Navigate to courses page with query parameter to open edit modal
    this.router.navigate(['/courses'], {
      queryParams: { edit: this.course._id },
    });
  }
}
