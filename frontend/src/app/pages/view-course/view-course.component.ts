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

  // Expose console for debugging
  console = console;

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

    this.courseService
      .getCourse(courseId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (course) => {
          this.course = course;
          this.loading = false;

          // Get professor information directly from the course object
          if (course.professorId) {
            // If professorId is a User object with details
            if (typeof course.professorId === 'object') {
              // Explicitly cast to avoid TypeScript errors
              const professor = course.professorId as any;
              this.professorName =
                professor.name ||
                professor.username ||
                professor.email ||
                'Unknown';
            }
            // If it's just a string ID, set a default
            else if (typeof course.professorId === 'string') {
              this.professorName = 'Professor ID: ' + course.professorId;
            }
          } else {
            this.professorName = 'Not assigned';
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
   * Set the active tab
   */
  setActiveTab(tab: 'students' | 'exams' | 'grades'): void {
    this.activeTab = tab;
  }

  /**
   * Format days array into readable string
   */
  formatDays(days: string[] | undefined): string {
    if (!days || days.length === 0) return 'No scheduled days';
    return days.join(', ');
  }

  /**
   * Get formatted text for prerequisites
   */
  getPrerequisitesText(): string {
    if (!this.course?.prerequisites || this.course.prerequisites.length === 0) {
      return 'None';
    }

    return this.course.prerequisites
      .map((prereq) => {
        // Handle different prerequisite formats based on the API response
        try {
          // If the prerequisite is a full course object (like in your example)
          if (prereq && prereq.name) {
            return prereq.name;
          }

          // If it has a prerequisiteCourseId property
          if (prereq && prereq.prerequisiteCourseId) {
            // If prerequisiteCourseId is an object with a name
            if (
              typeof prereq.prerequisiteCourseId === 'object' &&
              prereq.prerequisiteCourseId !== null &&
              prereq.prerequisiteCourseId.name
            ) {
              return prereq.prerequisiteCourseId.name;
            }
            // If prerequisiteCourseId is a string
            if (typeof prereq.prerequisiteCourseId === 'string') {
              return `Course ID: ${prereq.prerequisiteCourseId}`;
            }
          }

          // If it's just a string ID
          if (typeof prereq === 'string') {
            return `Course ID: ${prereq}`;
          }
        } catch (e) {
          console.error('Error parsing prerequisite:', e);
          return 'Error parsing prerequisite';
        }
        return '';
      })
      .join(', ');
  }

  /**
   * Debug professor info
   */
  debugProfessorInfo(): void {
    if (
      this.course &&
      this.course.professorId &&
      typeof this.course.professorId === 'object'
    ) {
    }
  }
}
