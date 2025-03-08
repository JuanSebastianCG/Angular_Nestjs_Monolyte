import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { Course } from '../../models/course.model';
import { Prerequisite } from '../../models/prerequisite.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../components/notification/notification.service';
import { ExamService } from '../../services/exam.service';
import {
  GradeService,
  GradeWithDetails,
  StudentGrade,
} from '../../services/grade.service';
import { EnrollmentService } from '../../services/enrollment.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * Interface for student reference objects
 */
interface StudentRef {
  _id: string;
  name: string;
  email?: string;
}

/**
 * Interface for enrollment data
 */
interface Enrollment {
  _id: string;
  studentId: string | StudentRef;
  studentName: string;
  enrollmentDate: string;
  status: string;
}

/**
 * Interface for course prerequisites
 */
interface CoursePrerequisite {
  _id: string;
  name: string;
  description: string;
  professorId: string | null;
  scheduleId?: string;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Interface for evaluation data
 */
interface Evaluation {
  _id: string;
  evaluationDate: string;
  name: string;
  description: string;
  maxScore: number;
  courseId: string;
  createdAt?: string;
  updatedAt?: string;
  studentGrades?: StudentGrade[];
  expanded?: boolean;
}

/**
 * Interface for course schedule
 */
interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
}

/**
 * CourseDetailComponent - Displays and manages course details including:
 * - Basic course information
 * - Enrolled students
 * - Evaluations (exams, assignments)
 * - Student grades
 * - Course prerequisites
 */
@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-detail.component.html',
  styles: [],
})
export class CourseDetailComponent implements OnInit {
  // Basic component properties
  courseId: string = '';
  course: Course | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  userName: string = '';
  userId: string = '';
  userRole: 'student' | 'professor' | 'admin' = 'student';
  hasAccess: boolean = false;

  // Tab navigation
  tabs = [
    { id: 'students', name: 'Students' },
    { id: 'evaluations', name: 'Evaluations' },
    { id: 'grades', name: 'Grades' },
  ];
  activeTab: string = 'students';

  // Student enrollments
  enrollments: Enrollment[] = [];
  filteredEnrollments: Enrollment[] = [];
  studentSearchTerm: string = '';
  isLoadingEnrollments: boolean = false;

  // Evaluations
  evaluations: Evaluation[] = [];
  isLoadingEvaluations: boolean = false;

  // Grades
  grades: GradeWithDetails[] = [];
  studentGrades: GradeWithDetails[] = [];
  studentAverage: number | null = null;
  isLoadingGrades: boolean = false;

  // Prerequisites
  prerequisites: CoursePrerequisite[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private courseService: CourseService,
    private authService: AuthService,
    private examService: ExamService,
    private gradeService: GradeService,
    private notificationService: NotificationService,
    private enrollmentService: EnrollmentService,
  ) {}

  /**
   * Initialize component, load data and setup
   */
  ngOnInit(): void {
    this.initializeComponent();
  }

  /**
   * Initialize component with course data and user info
   */
  private initializeComponent(): void {
    this.isLoading = true;

    // Get user info
    const userData = this.authService.currentUserValue;
    if (userData) {
      this.userId = userData.id;
      this.userName = userData.name;
      this.userRole = userData.role as any;
    }

    // Get course ID from route
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      if (id) {
        this.courseId = id;
        this.loadCourseData();
      } else {
        this.errorMessage = 'Course ID not found in URL';
        this.isLoading = false;
      }
    });
  }

  /**************************************************************************
   * COURSE DATA MANAGEMENT
   **************************************************************************/

  /**
   * Load course data and related information
   */
  private loadCourseData(): void {
    this.isLoading = true;

    // Get authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Get course details
    this.http
      .get<Course>(`${environment.apiUrl}/courses/${this.courseId}`, {
        headers,
      })
      .pipe(
        catchError((error) => {
          this.notificationService.error('Failed to load course details');
          this.isLoading = false;
          return of(null);
        }),
      )
      .subscribe((course) => {
        this.isLoading = false;

        if (course) {
          this.course = course;
          this.hasAccess = true;

          // Load course prerequisites
          this.loadPrerequisites();

          // Check if student is enrolled
          if (this.userRole === 'student') {
            this.checkStudentEnrollment();
          }

          // Load initial tab data
          this.loadTabData(this.activeTab);
        } else {
          this.hasAccess = false;
          this.errorMessage = 'Course not found or access denied';
        }
      });
  }

  /**
   * Load course prerequisites
   */
  private loadPrerequisites(): void {
    if (!this.courseId) return;

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<
        CoursePrerequisite[]
      >(`${environment.apiUrl}/prerequisites/course/${this.courseId}`, { headers })
      .subscribe(
        (prerequisites) => {
          this.prerequisites = prerequisites || [];
        },
        (error) => {
          console.error('Error loading prerequisites:', error);
        },
      );
  }

  /**
   * Check if current student is enrolled in this course
   */
  private checkStudentEnrollment(): void {
    if (this.userRole !== 'student' || !this.userId || !this.courseId) return;

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<any>(
        `${environment.apiUrl}/enrollments/${this.userId}/${this.courseId}`,
        { headers },
      )
      .pipe(
        catchError((error) => {
          return of(null);
        }),
      )
      .subscribe((enrollment) => {
        if (enrollment) {
          // Update course with enrollment info
          if (this.course) {
            this.course.isEnrolled = true;
            this.course.enrollmentStatus = enrollment.status;
            this.course.enrollmentDate = enrollment.enrollmentStartDate;
          }
        }
      });
  }

  /**************************************************************************
   * ENROLLMENT MANAGEMENT
   **************************************************************************/

  /**
   * Load student enrollments for this course
   */
  loadStudentEnrollments(): void {
    this.isLoadingEnrollments = true;

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    this.http
      .get<any[]>(`${environment.apiUrl}/enrollments/course/${this.courseId}`, {
        headers,
      })
      .pipe(
        catchError((error) => {
          this.notificationService.error('Failed to load enrolled students');
          return of([]);
        }),
        finalize(() => {
          this.isLoadingEnrollments = false;
        }),
      )
      .subscribe((enrollments) => {
        // Map enrollments to internal format
        this.enrollments = enrollments.map((enrollment) => {
          // Extract student info
          let studentName = 'Unknown Student';

          if (
            typeof enrollment.studentId === 'object' &&
            enrollment.studentId
          ) {
            studentName = enrollment.studentId.name || 'Unknown Student';
          }

          return {
            _id: enrollment._id,
            studentId: enrollment.studentId,
            studentName: studentName,
            enrollmentDate: enrollment.enrollmentStartDate,
            status: enrollment.status || 'active',
          };
        });

        // Initialize filtered enrollments
        this.filteredEnrollments = [...this.enrollments];
      });
  }

  /**
   * Filter students based on search term
   */
  filterStudents(): void {
    if (!this.studentSearchTerm.trim()) {
      this.filteredEnrollments = [...this.enrollments];
      return;
    }

    const searchTerm = this.studentSearchTerm.toLowerCase().trim();

    this.filteredEnrollments = this.enrollments.filter((enrollment) => {
      return enrollment.studentName.toLowerCase().includes(searchTerm);
    });
  }

  /**************************************************************************
   * EVALUATION MANAGEMENT
   **************************************************************************/

  /**
   * Load evaluations for this course
   */
  loadEvaluations(): void {
    this.isLoadingEvaluations = true;

    // Get authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Use the correct endpoint to get evaluations for this course
    this.http
      .get<Evaluation[]>(
        `${environment.apiUrl}/evaluations/course/${this.courseId}`,
        { headers },
      )
      .pipe(
        catchError((error) => {
          this.notificationService.error('Failed to load course evaluations');
          console.error('Error loading evaluations:', error);
          return of([]);
        }),
        finalize(() => {
          this.isLoadingEvaluations = false;
        }),
      )
      .subscribe((evaluations) => {
        this.evaluations = evaluations.map((evaluation) => ({
          ...evaluation,
          expanded: false,
          studentGrades: [],
        }));

        // Prepare evaluations with their expanded state
        if (this.userRole === 'professor' || this.userRole === 'admin') {
          this.prepareEvaluationsWithGrades();
        }
      });
  }

  /**
   * Create a new evaluation for this course
   */
  createNewEvaluation(): void {
    this.router.navigate(['/evaluations/new'], {
      queryParams: { courseId: this.courseId },
    });
  }

  /**
   * View evaluation details
   */
  viewEvaluationDetails(evaluationId: string): void {
    this.router.navigate(['/evaluations', evaluationId]);
  }

  /**
   * Navigate to edit evaluation form
   */
  editEvaluation(evaluationId: string): void {
    this.router.navigate(['/evaluations', evaluationId, 'edit'], {
      queryParams: { courseId: this.courseId },
    });
  }

  /**
   * Navigate to grade management page for an evaluation
   */
  manageGrades(evaluationId: string): void {
    const evaluation = this.evaluations.find((e) => e._id === evaluationId);
    if (!evaluation) {
      this.notificationService.error('Evaluation not found');
      return;
    }

    // Navigate to a grade management page with the evaluationId
    this.router.navigate(['/evaluations', evaluationId, 'grades'], {
      queryParams: {
        courseId: this.courseId,
        evaluationName: evaluation.name,
      },
    });
  }

  /**
   * Navigate to edit a specific grade
   */
  editGrade(gradeId: string): void {
    this.router.navigate(['/grades', gradeId, 'edit'], {
      queryParams: { courseId: this.courseId },
    });
  }

  /**
   * Toggle evaluation expansion to show/hide grades
   */
  toggleEvaluationExpansion(evaluation: Evaluation): void {
    // Toggle expanded state
    evaluation.expanded = !evaluation.expanded;

    // Load grades if expanding and no grades loaded yet
    if (
      evaluation.expanded &&
      (!evaluation.studentGrades || evaluation.studentGrades.length === 0)
    ) {
      this.loadEvaluationGrades(evaluation._id);
    }
  }

  /**
   * Load student grades for a specific evaluation
   */
  loadEvaluationGrades(evaluationId: string): void {
    const evaluation = this.evaluations.find((e) => e._id === evaluationId);
    if (!evaluation) return;

    evaluation.studentGrades = [];
    this.isLoadingGrades = true;

    // Get the authentication token
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Use the correct endpoint to get grades for this evaluation
    this.http
      .get<StudentGrade[]>(
        `${environment.apiUrl}/student-grades/evaluation/${evaluationId}`,
        { headers },
      )
      .pipe(
        catchError((error) => {
          this.notificationService.error(
            'Failed to load student grades for this evaluation',
          );
          console.error('Error loading evaluation grades:', error);
          return of([]);
        }),
        finalize(() => {
          this.isLoadingGrades = false;
        }),
      )
      .subscribe((grades) => {
        // Update the evaluation with the fetched grades
        if (evaluation) {
          evaluation.studentGrades = grades;
          console.log(
            `Loaded ${grades.length} grades for evaluation ${evaluationId}`,
          );
        }
      });
  }

  /**
   * Prepare evaluations to potentially hold grades
   */
  prepareEvaluationsWithGrades(): void {
    // Initialize expanded property on all evaluations
    this.evaluations.forEach((evaluation) => {
      evaluation.expanded = !!evaluation.expanded;
      evaluation.studentGrades = evaluation.studentGrades || [];
    });
  }

  /**************************************************************************
   * GRADES MANAGEMENT
   **************************************************************************/

  /**
   * Load grades for the course
   */
  loadGrades(): void {
    this.isLoadingGrades = true;

    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });

    // Different endpoints based on user role
    let endpoint = `${environment.apiUrl}/student-grades/course/${this.courseId}`;

    // If student, only get their own grades
    if (this.userRole === 'student') {
      endpoint = `${environment.apiUrl}/student-grades/student/${this.userId}/course/${this.courseId}`;
    }

    this.http
      .get<GradeWithDetails[]>(endpoint, { headers })
      .pipe(
        catchError((error) => {
          this.notificationService.error('Failed to load grades');
          return of([]);
        }),
        finalize(() => {
          this.isLoadingGrades = false;
        }),
      )
      .subscribe((grades) => {
        if (this.userRole === 'student') {
          this.studentGrades = grades;

          // Calculate average if there are grades
          if (grades.length > 0) {
            const sum = grades.reduce((acc, grade) => acc + grade.value, 0);
            this.studentAverage = sum / grades.length;
          }
        } else {
          this.grades = grades;
        }
      });
  }

  /**
   * Get grades for a specific evaluation
   */
  getGradesByEvaluation(evaluationId: string): GradeWithDetails[] {
    return this.grades.filter((grade) => grade.evaluationId === evaluationId);
  }

  /**************************************************************************
   * TAB NAVIGATION
   **************************************************************************/

  /**
   * Load data for the selected tab
   */
  loadTabData(tabId: string): void {
    switch (tabId) {
      case 'students':
        this.loadStudentEnrollments();
        break;
      case 'evaluations':
        this.loadEvaluations();
        break;
      case 'grades':
        this.loadGrades();
        break;
    }
  }

  /**
   * Change active tab and load its data
   */
  selectTab(tabId: string): void {
    if (this.activeTab === tabId) return;

    this.activeTab = tabId;
    this.loadTabData(tabId);
  }

  /**************************************************************************
   * NAVIGATION AND UTILITIES
   **************************************************************************/

  /**
   * Navigate back to previous screen
   */
  goBack(event?: Event): void {
    if (event) {
      event.preventDefault();
    }

    // Navigate to course list or user dashboard
    if (this.userRole === 'student') {
      this.router.navigate(['/student/courses']);
    } else if (this.userRole === 'professor') {
      this.router.navigate(['/professor/courses']);
    } else {
      this.router.navigate(['/admin/courses']);
    }
  }
}
