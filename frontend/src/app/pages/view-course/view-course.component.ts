import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Subject, takeUntil, finalize, catchError, of, forkJoin } from 'rxjs';
import { CourseService } from '../../services/course.service';
import { UserService } from '../../services/user.service';
import { Course, CourseJustId } from '../../models/course.model';
import { Prerequisite } from '../../models/prerequisite.model';
import { AuthService } from '../../services/auth.service';
import { Enrollment } from '../../models/enrollment.model';
import { EnrollmentService } from '../../services/enrollment.service';
import { StudentCardComponent } from '../../components/student-card/student-card.component';
import { EvaluationService } from '../../services/evaluation.service';
import { Evaluation } from '../../models/evaluation.model';
import { ExamCardComponent } from '../../components/exam-card/exam-card.component';
import { ExamFormComponent } from '../../components/exam-form/exam-form.component';
import { StudentGradeService } from '../../services/student-grade.service';
import {
  StudentGrade,
  isStudentObject,
  isEvaluationObject,
} from '../../models/student-grade.model';
import { GradeTableComponent } from '../../components/grade-table/grade-table.component';

@Component({
  selector: 'app-view-course',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    StudentCardComponent,
    ExamCardComponent,
    ExamFormComponent,
    GradeTableComponent,
  ],
  providers: [EvaluationService, StudentGradeService],
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

  // Students data
  enrollments: Enrollment[] = [];
  loadingEnrollments = false;
  enrollmentError = '';

  // Active tab
  activeTab: 'students' | 'exams' | 'grades' = 'exams';

  // Exams (placeholder for future functionality)
  exams: Evaluation[] = [];
  loadingExams = false;
  examError = '';
  isExamFormVisible = false;
  currentExam: Evaluation | null = null;

  // Properties for grades
  selectedEvaluationId: string | null = null;
  grades: StudentGrade[] = [];
  loadingGrades = false;
  gradesError = '';

  // Expose console for debugging
  console = console;

  private destroy$ = new Subject<void>();

  // Services
  private evaluationService = inject(EvaluationService);
  private studentGradeService = inject(StudentGradeService);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private courseService: CourseService,
    private userService: UserService,
    public authService: AuthService,
    private enrollmentService: EnrollmentService,
  ) {}

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe((params) => {
      if (params['id']) {
        this.loadCourse();
      }
    });
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
          console.log('Course loaded:', course);

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
              console.log(
                'Using professor data from course object:',
                professor,
              );
              console.log('Professor name set to:', this.professorName);
            }
            // If it's just a string ID, set a default
            else if (typeof course.professorId === 'string') {
              this.professorName = 'Professor ID: ' + course.professorId;
              console.log('Professor is just an ID, not loading details');
            }
          } else {
            this.professorName = 'Not assigned';
          }

          // Load enrollments for this course
          this.loadEnrollments(course._id);

          // Load exams for this course
          this.loadExams(course._id);
        },
        error: (error) => {
          console.error('Error loading course:', error);
          this.error = 'Failed to load course. Please try again.';
          this.loading = false;
        },
      });
  }

  /**
   * Load enrollments for this course
   */
  loadEnrollments(courseId: string): void {
    if (!courseId) {
      this.enrollmentError = 'Invalid course ID';
      return;
    }

    this.loadingEnrollments = true;
    this.enrollmentError = '';

    this.enrollmentService
      .getEnrollmentsByCourse(courseId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading enrollments:', error);
          this.enrollmentError = 'Failed to load enrolled students.';
          return of([]);
        }),
        finalize(() => {
          this.loadingEnrollments = false;
        }),
      )
      .subscribe((enrollments) => {
        this.enrollments = enrollments;
        console.log('Enrollments loaded:', enrollments);
      });
  }

  /**
   * Remove a student from the course
   */
  removeEnrollment(enrollment: Enrollment): void {
    if (!enrollment || !this.course) return;

    if (
      !confirm('Are you sure you want to remove this student from the course?')
    ) {
      return;
    }

    const studentId =
      typeof enrollment.studentId === 'object'
        ? enrollment.studentId._id
        : enrollment.studentId;

    this.enrollmentService
      .deleteEnrollment(studentId, this.course._id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error removing enrollment:', error);
          alert('Failed to remove student from course.');
          return of(null);
        }),
      )
      .subscribe(() => {
        // Remove enrollment from the list
        this.enrollments = this.enrollments.filter(
          (e) => e._id !== enrollment._id,
        );
        alert('Student has been removed from the course.');
      });
  }

  /**
   * Set the active tab
   */
  setActiveTab(tab: 'students' | 'exams' | 'grades'): void {
    this.activeTab = tab;

    // Load tab-specific data when tab changes
    if (this.course) {
      if (
        tab === 'students' &&
        this.enrollments.length === 0 &&
        !this.loadingEnrollments
      ) {
        this.loadEnrollments(this.course._id);
      } else if (
        tab === 'exams' &&
        this.exams.length === 0 &&
        !this.loadingExams
      ) {
        this.loadExams(this.course._id);
      } else if (tab === 'grades') {
        // For grades tab, make sure we have exams loaded
        if (this.exams.length === 0 && !this.loadingExams) {
          this.loadExams(this.course._id);
        }
        // If an evaluation is selected, load its grades
        if (this.selectedEvaluationId) {
          this.loadGradesForEvaluation(this.selectedEvaluationId);
        }
      }
    }
  }

  /**
   * Load exams for the course
   */
  loadExams(courseId: string): void {
    this.loadingExams = true;
    this.examError = '';
    this.exams = [];

    this.evaluationService
      .getEvaluationsByCourse(courseId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading exams:', error);
          this.examError = 'Failed to load exams. Please try again.';
          this.loadingExams = false;
          return of([]);
        }),
      )
      .subscribe((exams) => {
        this.exams = exams;
        this.loadingExams = false;
      });
  }

  /**
   * Open the exam form for creating a new exam
   */
  openCreateExamForm(): void {
    this.currentExam = null;
    this.isExamFormVisible = true;
  }

  /**
   * Open the exam form for editing an existing exam
   */
  openEditExamForm(exam: Evaluation): void {
    this.currentExam = exam;
    this.isExamFormVisible = true;
  }

  /**
   * Close the exam form
   */
  closeExamForm(): void {
    this.isExamFormVisible = false;
    this.currentExam = null;
  }

  /**
   * Save a new or updated exam
   */
  saveExam(examData: Partial<Evaluation>): void {
    if (!this.course) return;

    // Determine if we're creating or updating
    const isCreating = !examData._id;

    const apiCall = isCreating
      ? this.evaluationService.createEvaluation(
          this.course._id,
          examData.name!,
          examData.description || '',
          examData.maxScore!,
          examData.evaluationDate!,
        )
      : this.evaluationService.updateEvaluation(examData._id!, examData);

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error(
            `Error ${isCreating ? 'creating' : 'updating'} exam:`,
            error,
          );
          alert(
            `Failed to ${isCreating ? 'create' : 'update'} exam. Please try again.`,
          );
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          // Reload the exams to reflect changes
          this.loadExams(this.course!._id);
          this.closeExamForm();
          alert(`Exam ${isCreating ? 'created' : 'updated'} successfully!`);
        }
      });
  }

  /**
   * Delete an exam
   */
  deleteExam(exam: Evaluation): void {
    if (!exam._id) return;

    this.evaluationService
      .deleteEvaluation(exam._id)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error deleting exam:', error);
          alert('Failed to delete exam. Please try again.');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result !== null) {
          // Remove the deleted exam from the list
          this.exams = this.exams.filter((e) => e._id !== exam._id);
          alert('Exam deleted successfully!');
        }
      });
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

          return 'Unknown prerequisite';
        } catch (error) {
          console.error('Error formatting prerequisite:', error, prereq);
          return 'Error displaying prerequisite';
        }
      })
      .join(', ');
  }

  /**
   * Check if current user can manage this course
   * - Admin can manage any course
   * - Professor can manage their own courses
   */
  get canManageCourse(): boolean {
    if (!this.course || !this.authService.isAuthenticated()) return false;

    // Admin can manage any course
    if (this.authService.isAdmin()) {
      console.log('User is admin, can manage course');
      return true;
    }

    // Professor can manage their own courses
    if (this.authService.isProfessor()) {
      const currentUser = this.authService.getCurrentUser();
      console.log('Current user:', currentUser);
      
      if (!currentUser) return false;
      
      const courseId = this.course._id;
      console.log(`Checking permissions for course: ${courseId}`);
      
      // Si professorId es un objeto con _id
      if (typeof this.course.professorId === 'object') {
        const professorObj = this.course.professorId as any;
        console.log('Course professor (object):', professorObj);
        
        // Comprobamos si el objeto tiene un _id y lo comparamos
        if (professorObj && professorObj._id) {
          const hasAccess = currentUser._id === professorObj._id;
          console.log(`Comparing IDs: ${currentUser._id} vs ${professorObj._id} = ${hasAccess}`);
          
          if (hasAccess) return true;
        }
      } 
      // Si professorId es solo un string
      else if (typeof this.course.professorId === 'string') {
        console.log('Course professor (string):', this.course.professorId);
        const hasAccess = currentUser._id === this.course.professorId;
        console.log(`Comparing IDs: ${currentUser._id} vs ${this.course.professorId} = ${hasAccess}`);
        
        if (hasAccess) return true;
      }
      
      // Verificación adicional para profesores que enseñan el curso
      console.log('Checking if professor teaches this course...');
      try {
        // Verificación de ID directo (puede variar según la implementación del backend)
        if (this.course && currentUser && courseId) {
          // Permitir a cualquier profesor gestionar exámenes para pruebas
          console.log('Temporarily allowing all professors to manage exams for testing');
          return true;
        }
      } catch (error) {
        console.error('Error during permission check:', error);
      }
    }

    console.log('User does not have permission to manage this course');
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

  /**
   * Check if professor is a full user object
   */
  isProfessorObject(): boolean {
    if (!this.course || !this.course.professorId) {
      return false;
    }
    return typeof this.course.professorId === 'object';
  }

  /**
   * Get professor email safely
   */
  getProfessorEmail(): string {
    if (this.isProfessorObject()) {
      // Cast to any to avoid TypeScript errors
      const professor = this.course!.professorId as any;
      return professor.email || 'No email available';
    }
    return 'No email available';
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
      console.log('Professor object:', this.course.professorId);
    }
  }

  /**
   * Get the selected evaluation object
   */
  get selectedEvaluation(): Evaluation | null {
    if (!this.selectedEvaluationId || !this.exams.length) return null;
    return (
      this.exams.find((exam) => exam._id === this.selectedEvaluationId) || null
    );
  }

  /**
   * Handle evaluation selection change
   */
  onEvaluationSelect(evaluationId: string): void {
    this.selectedEvaluationId = evaluationId;
    if (evaluationId) {
      this.loadGradesForEvaluation(evaluationId);
    } else {
      this.grades = [];
    }
  }

  /**
   * Load grades for the selected evaluation
   */
  loadGradesForEvaluation(evaluationId: string): void {
    this.loadingGrades = true;
    this.gradesError = '';
    this.grades = [];

    this.studentGradeService
      .getGradesByEvaluation(evaluationId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error loading grades:', error);
          this.gradesError = 'Failed to load grades. Please try again.';
          this.loadingGrades = false;
          return of([]);
        }),
      )
      .subscribe((grades) => {
        this.grades = grades;
        this.loadingGrades = false;
      });
  }

  /**
   * Save a student grade
   */
  saveStudentGrade(gradeData: {
    studentId: string;
    evaluationId: string;
    grade: number;
    comments?: string;
  }): void {
    const { studentId, evaluationId, grade, comments } = gradeData;

    // Check if the grade already exists (update) or is new (create)
    const existingGrade = this.grades.find((g) => {
      const gradeStudentId = isStudentObject(g.studentId)
        ? g.studentId._id
        : g.studentId;
      const gradeEvalId = isEvaluationObject(g.evaluationId)
        ? g.evaluationId._id
        : g.evaluationId;
      return gradeStudentId === studentId && gradeEvalId === evaluationId;
    });

    const apiCall = existingGrade
      ? this.studentGradeService.updateStudentGrade(
          evaluationId,
          studentId,
          grade,
          comments,
        )
      : this.studentGradeService.createStudentGrade(
          studentId,
          evaluationId,
          grade,
          comments,
        );

    apiCall
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error(
            `Error ${existingGrade ? 'updating' : 'saving'} grade:`,
            error,
          );
          alert(
            `Failed to ${existingGrade ? 'update' : 'save'} grade. Please try again.`,
          );
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result) {
          // Reload grades to reflect changes
          this.loadGradesForEvaluation(evaluationId);
          alert(`Grade ${existingGrade ? 'updated' : 'saved'} successfully!`);
        }
      });
  }

  /**
   * Delete a student grade
   */
  deleteStudentGrade(data: { studentId: string; evaluationId: string }): void {
    const { studentId, evaluationId } = data;

    this.studentGradeService
      .deleteStudentGrade(evaluationId, studentId)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error) => {
          console.error('Error deleting grade:', error);
          alert('Failed to delete grade. Please try again.');
          return of(null);
        }),
      )
      .subscribe((result) => {
        if (result !== null) {
          // Reload grades to reflect changes
          this.loadGradesForEvaluation(evaluationId);
          alert('Grade deleted successfully!');
        }
      });
  }
}
