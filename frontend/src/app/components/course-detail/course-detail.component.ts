import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { CourseService } from '../../services/course.service';
import { Course } from '../../models/course.model';
import { Prerequisite } from '../../models/prerequisite.model';
import { Student } from '../../models/student.model';
import { AuthService } from '../../services/auth.service';
import { NotificationService } from '../../components/notification/notification.service';
import { ExamService, Exam } from '../../services/exam.service';
import { GradeService, GradeWithDetails, Grade, StudentGrade } from '../../services/grade.service';
import { EnrollmentService, Enrollment as ApiEnrollment } from '../../services/enrollment.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

interface Enrollment {
  _id: string;
  studentId: string;
  studentName: string;
  enrollmentDate: string;
  status: string;
}

interface CoursePrerequisite {
  _id: string;
  name: string;
  description: string;
  professorId: string | null;
  scheduleId?: any;
  createdAt?: string;
  updatedAt?: string;
}

// Interfaz para las evaluaciones
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

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule],
  templateUrl: './course-detail.component.html',
  styles: []
})
export class CourseDetailComponent implements OnInit {
  courseId: string = '';
  course: Course | null = null;
  isLoading: boolean = false;
  errorMessage: string = '';
  userName: string = '';
  userId: string = '';
  userRole: 'student' | 'professor' | 'admin' = 'student';
  hasAccess: boolean = false;
  
  // Tabs
  tabs = [
    { id: 'students', name: 'Estudiantes' },
    { id: 'exams', name: 'Evaluaciones' },
    { id: 'grades', name: 'Calificaciones' }
  ];
  activeTab: string = 'students';
  
  // Student Enrollments
  enrollments: Enrollment[] = [];
  filteredEnrollments: Enrollment[] = [];
  studentSearchTerm: string = '';
  isLoadingEnrollments: boolean = false;
  
  // Evaluations (antes Exams)
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
    private enrollmentService: EnrollmentService
  ) {}

  ngOnInit(): void {
    console.log('CourseDetailComponent - ngOnInit iniciado');
    
    // Get user info
    const currentUser = this.authService.currentUserValue;
    this.userName = currentUser?.name || '';
    this.userId = currentUser?.id || '';
    console.log('CourseDetailComponent - Usuario:', this.userName, 'ID:', this.userId);

    // Set user role
    if (currentUser?.role) {
      const role = currentUser.role.toLowerCase();
      if (role === 'student' || role === 'professor' || role === 'admin') {
        this.userRole = role as 'student' | 'professor' | 'admin';
        console.log('CourseDetailComponent - Rol del usuario:', this.userRole);
      }
    }

    // Get course ID from route
    this.route.paramMap.subscribe(params => {
      console.log('CourseDetailComponent - Parámetros de ruta:', params);
      const id = params.get('id');
      if (id) {
        console.log('CourseDetailComponent - ID del curso:', id);
        this.courseId = id;
        this.loadCourseData();
      } else {
        console.error('CourseDetailComponent - ID de curso no proporcionado en los parámetros');
        this.errorMessage = 'ID de curso no proporcionado.';
      }
    });

    // Filter enrollments when search term changes
    this.setupSearchFilter();
    console.log('CourseDetailComponent - ngOnInit finalizado');
  }

  loadCourseData(): void {
    this.isLoading = true;
    this.errorMessage = '';
    console.log('📥 Cargando datos del curso con ID:', this.courseId);

    // Cargamos detalles del curso y verificamos permisos de acceso
    this.courseService.getCourseById(this.courseId).subscribe({
      next: (course) => {
        console.log('✅ Datos del curso recibidos:', course);
        
        if (!course) {
          console.error('❌ El curso no existe o no se recibieron datos válidos');
          this.errorMessage = 'El curso solicitado no existe o ha sido eliminado.';
          this.isLoading = false;
          return;
        }
        
        this.course = course;
        
        // Extraer los prerrequisitos directamente de la respuesta del curso
        this.extractPrerequisites(course);
        
        // Verificar acceso según el rol del usuario
        if (this.userRole === 'admin' || this.userRole === 'professor') {
          this.hasAccess = true;
          console.log('✅ Acceso concedido como:', this.userRole);
        } else if (this.userRole === 'student') {
          console.log('🔍 Verificando inscripción del estudiante con ID:', this.userId);
          // Para estudiantes, verificamos si está inscrito en el curso
          this.checkStudentEnrollment();
        } else {
          this.hasAccess = false;
          console.error('❌ Acceso denegado para el rol de usuario:', this.userRole);
          this.errorMessage = 'No tienes permiso para ver este curso.';
        }
        
        this.isLoading = false;
        
        // Solo cargamos datos de pestaña si tiene acceso
        if (this.hasAccess) {
          console.log('📊 Cargando datos adicionales para la pestaña:', this.activeTab);
          this.loadTabData(this.activeTab);
        }
      },
      error: (error) => {
        console.error('❌ Error al cargar detalles del curso:', error);
        this.errorMessage = 'No se pudo cargar el curso. Por favor intente de nuevo.';
        this.isLoading = false;
      }
    });
  }

  extractPrerequisites(course: any): void {
    // Verificar si el curso tiene prerrequisitos y procesarlos
    if (course && course.prerequisites && Array.isArray(course.prerequisites)) {
      console.log('✅ Prerequisites found in course data:', course.prerequisites.length);
      this.prerequisites = course.prerequisites.map((prerequisite: any) => {
        if (!prerequisite) {
          console.warn('⚠️ Se encontró un prerequisito nulo o indefinido');
          return null;
        }
        
        return {
          _id: prerequisite._id || '',
          name: prerequisite.name || 'Prerequisito sin nombre',
          description: prerequisite.description || '',
          professorId: prerequisite.professorId || null,
          scheduleId: prerequisite.scheduleId || null,
          createdAt: prerequisite.createdAt || '',
          updatedAt: prerequisite.updatedAt || ''
        };
      }).filter((prereq: CoursePrerequisite | null) => prereq !== null); // Eliminar cualquier prerrequisito nulo
    } else {
      console.log('ℹ️ No prerequisites found in course data');
      this.prerequisites = [];
    }
  }

  checkStudentEnrollment(): void {
    if (!this.userId) {
      console.error('❌ ID de usuario no disponible para verificar inscripción');
      this.hasAccess = false;
      this.errorMessage = 'No se pudo verificar tu información de usuario.';
      return;
    }

    console.log('👨‍🎓 Verificando inscripción del estudiante ID:', this.userId, 'en curso ID:', this.courseId);
    
    // Por defecto, no tiene acceso hasta que se verifique
    this.hasAccess = false;

    // Usar el método getCoursesByStudent en lugar de getEnrollmentsByStudent
    this.courseService.getCoursesByStudent(this.userId).subscribe({
      next: (courses: Course[]) => {
        console.log('📚 Cursos recibidos:', courses.length, 'cursos');
        
        if (!courses || courses.length === 0) {
          console.log('⚠️ Estudiante no tiene cursos inscritos');
          this.hasAccess = false;
          this.errorMessage = 'No estás inscrito en ningún curso.';
          return;
        }
        
        // Verificar si el estudiante está inscrito en este curso
        const isEnrolled = courses.some((course: Course) => {
          const courseId = course._id;
          console.log(`🔄 Comparando curso inscrito: ${courseId} con curso actual ${this.courseId}`);
          return courseId === this.courseId;
        });

        console.log('🎯 Resultado de verificación de inscripción:', isEnrolled ? 'INSCRITO' : 'NO INSCRITO');
        
        this.hasAccess = isEnrolled;
        
        if (!isEnrolled) {
          console.log('⚠️ Estudiante no inscrito en este curso. hasAccess =', this.hasAccess);
          this.errorMessage = 'No estás inscrito en este curso.';
        } else {
          console.log('✅ Estudiante inscrito en este curso. hasAccess =', this.hasAccess);
        }
      },
      error: (error: any) => {
        console.error('❌ Error al verificar inscripción del estudiante:', error);
        this.hasAccess = false;
        this.errorMessage = 'No se pudo verificar tu inscripción en este curso.';
      }
    });
  }

  setupSearchFilter(): void {
    // Simple implementation for the demo
    // In a real app, you might want to use RxJS debounceTime/distinctUntilChanged
    setInterval(() => {
      if (this.enrollments && this.studentSearchTerm) {
        this.filteredEnrollments = this.enrollments.filter(e => 
          e.studentName.toLowerCase().includes(this.studentSearchTerm.toLowerCase())
        );
      } else {
        this.filteredEnrollments = [...this.enrollments];
      }
    }, 300);
  }

  setActiveTab(tabId: string): void {
    this.activeTab = tabId;
    this.loadTabData(tabId);
  }

  loadTabData(tabId: string): void {
    switch (tabId) {
      case 'students':
        this.loadStudentEnrollments();
        break;
      case 'exams':
        this.loadEvaluations();
        break;
      case 'grades':
        this.loadGrades();
        break;
    }
  }

  loadStudentEnrollments(): void {
    this.isLoadingEnrollments = true;
    this.enrollments = [];
    console.log('📚 Cargando inscripciones para el curso ID:', this.courseId);
    
    // Usar el servicio de inscripciones para obtener las inscripciones por curso
    this.enrollmentService.getEnrollmentsByCourse(this.courseId).subscribe({
      next: (enrollments: ApiEnrollment[]) => {
        console.log('📊 Inscripciones recibidas:', enrollments.length);
        
        // Transformar los datos de inscripción al formato que espera la UI
        this.enrollments = enrollments.map((enrollment: ApiEnrollment) => {
          // Verificar si studentId es un objeto y extraer los datos
          let studentName = 'Estudiante sin nombre';
          let studentId = '';
          
          if (enrollment.studentId && typeof enrollment.studentId === 'object') {
            const student = enrollment.studentId as any;
            studentName = student.name || 'Estudiante sin nombre';
            studentId = student._id || '';
          } else {
            studentId = enrollment.studentId as string;
          }
          
          return {
            _id: enrollment._id || '',
            studentId: studentId,
            studentName: studentName,
            enrollmentDate: enrollment.enrollmentStartDate || new Date().toISOString().split('T')[0],
            status: enrollment.status || 'start'
          };
        });
        
        this.filteredEnrollments = [...this.enrollments];
        this.isLoadingEnrollments = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar inscripciones:', error);
        this.isLoadingEnrollments = false;
        this.notificationService.error('No se pudieron cargar los estudiantes inscritos.');
      }
    });
  }

  loadEvaluations(): void {
    if (!this.courseId || !this.hasAccess) return;
    
    this.isLoadingEvaluations = true;
    console.log('📝 Cargando evaluaciones para el curso ID:', this.courseId);
    
    // Obtener el token para la autorización
    const token = this.authService.getToken();
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
    
    // Llamar directamente al endpoint de evaluaciones
    this.http.get<Evaluation[]>(`${environment.apiUrl}/evaluations/course/${this.courseId}`, { headers })
      .subscribe({
        next: (evaluations: Evaluation[]) => {
          console.log(`✅ Cargadas ${evaluations.length} evaluaciones para el curso ${this.courseId}`);
          this.evaluations = evaluations;
          this.prepareEvaluationsWithGrades();
          this.isLoadingEvaluations = false;
        },
        error: (error: any) => {
          console.error('❌ Error al cargar evaluaciones:', error);
          this.notificationService.error('No se pudieron cargar las evaluaciones.');
          this.isLoadingEvaluations = false;
        }
      });
  }

  loadGrades(): void {
    if (!this.courseId || !this.hasAccess) return;
    
    this.isLoadingGrades = true;
    console.log('📊 Cargando calificaciones para el curso ID:', this.courseId);
    
    // Call API to get course grades
    this.gradeService.getGradesByCourse(this.courseId).subscribe({
      next: (grades: GradeWithDetails[]) => {
        console.log(`✅ Cargadas ${grades.length} calificaciones para el curso ${this.courseId}`);
        
        // Mapear las calificaciones para que usen evaluationId en lugar de examId cuando sea necesario
        this.grades = grades.map(grade => {
          // Si la calificación tiene un examId pero no evaluationId, usar el examId como evaluationId
          if (grade.examId && !grade.evaluationId) {
            return {
              ...grade,
              evaluationId: grade.examId
            };
          }
          return grade;
        });
        
        // If student, filter grades to show only their own
        if (this.userRole === 'student' && this.userId) {
          this.studentGrades = this.grades.filter(g => g.studentId === this.userId);
          
          // Calculate average if there are grades
          if (this.studentGrades.length > 0) {
            const sum = this.studentGrades.reduce((acc, grade) => acc + grade.value, 0);
            this.studentAverage = sum / this.studentGrades.length;
            console.log(`📈 Promedio del estudiante: ${this.studentAverage}`);
          } else {
            this.studentAverage = null;
          }
        }
        
        this.isLoadingGrades = false;
      },
      error: (error: any) => {
        console.error('❌ Error al cargar calificaciones:', error);
        this.notificationService.error('No se pudieron cargar las calificaciones.');
        this.isLoadingGrades = false;
      }
    });
  }

  getGradesByEvaluation(evaluationId: string): GradeWithDetails[] {
    return this.grades.filter(g => g.evaluationId === evaluationId);
  }

  viewStudentDetails(studentId: string): void {
    // Navigate to student profile/details
    console.log('View student details:', studentId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  createNewEvaluation(): void {
    // Will be implemented in a separate component
    console.log('Create new evaluation for course:', this.courseId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  viewEvaluationDetails(evaluationId: string): void {
    // Navigate to evaluation details
    console.log('View evaluation details:', evaluationId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  editEvaluation(evaluationId: string): void {
    // Navigate to evaluation edit page or show modal
    console.log('Edit evaluation:', evaluationId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  manageGrades(evaluationId: string): void {
    // Navigate to grade management page for this evaluation
    console.log('Manage grades for evaluation:', evaluationId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  editGrade(gradeId: string): void {
    // Show edit grade modal or navigate to edit page
    console.log('Edit grade:', gradeId);
    this.notificationService.info('Funcionalidad en desarrollo');
  }

  goBack(event?: Event): void {
    if (event) {
      event.preventDefault();
      console.log('🔙 Método goBack() llamado por un evento de usuario con prevención de comportamiento predeterminado');
      console.log('🔍 Evento originado en:', (event.target as HTMLElement).tagName);
    } else {
      console.log('⚠️ ATENCIÓN: Método goBack() llamado sin evento, posible redirección automática no deseada');
      console.log('🔍 Stack trace:', new Error().stack);
    }
    console.log('🔙 Navegando de regreso a /cursos');
    this.router.navigate(['/cursos']);
  }

  // Método para seleccionar una pestaña
  selectTab(tabId: string): void {
    console.log(`📑 Seleccionando pestaña: ${tabId}`);
    if (this.activeTab === tabId) {
      return; // Ya está activa, no hacemos nada
    }
    
    this.activeTab = tabId;
    this.loadTabData(tabId);
  }

  // Filtrar estudiantes por nombre
  filterStudents(): void {
    console.log(`🔍 Filtrando estudiantes con término: ${this.studentSearchTerm}`);
    
    if (!this.studentSearchTerm || this.studentSearchTerm.trim() === '') {
      this.filteredEnrollments = [...this.enrollments];
      return;
    }
    
    const searchTerm = this.studentSearchTerm.toLowerCase().trim();
    this.filteredEnrollments = this.enrollments.filter(enrollment => 
      enrollment.studentName.toLowerCase().includes(searchTerm)
    );
    
    console.log(`📋 Filtrado completado: ${this.filteredEnrollments.length} resultados`);
  }

  // Método para preparar las evaluaciones con calificaciones
  prepareEvaluationsWithGrades(): void {
    // Inicializar los campos expanded y studentGrades en cada evaluación
    this.evaluations = this.evaluations.map(evaluation => ({
      ...evaluation,
      studentGrades: [],
      expanded: false
    }));
  }

  // Método para cargar las calificaciones de una evaluación específica
  loadEvaluationGrades(evaluationId: string): void {
    if (this.userRole !== 'professor' && this.userRole !== 'admin') {
      this.notificationService.error('Solo profesores y administradores pueden ver las calificaciones detalladas');
      return;
    }

    if (!this.courseId) {
      this.notificationService.error('No se puede cargar las calificaciones sin un curso seleccionado');
      return;
    }

    console.log(`Cargando calificaciones para la evaluación: ${evaluationId} del curso: ${this.courseId}`);

    this.isLoadingGrades = true;

    const apiUrl = `${environment.apiUrl}/student-grades/evaluation/${evaluationId}`;
    
    // Obtener el token de autorización
    const token = this.authService.getToken();
    if (!token) {
      this.notificationService.error('No hay sesión activa');
      this.isLoadingGrades = false;
      return;
    }

    const httpOptions = {
      headers: new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      })
    };

    this.http.get<StudentGrade[]>(apiUrl, httpOptions)
      .pipe(
        tap(grades => console.log('Calificaciones cargadas:', grades)),
        catchError(error => {
          console.error('Error al cargar las calificaciones:', error);
          this.notificationService.error('No se pudieron cargar las calificaciones de los estudiantes');
          return of([]);
        }),
        finalize(() => {
          this.isLoadingGrades = false;
        })
      )
      .subscribe(grades => {
        // Buscamos la evaluación correspondiente
        const evaluationIndex = this.evaluations.findIndex(e => e._id === evaluationId);
        
        if (evaluationIndex !== -1) {
          // Actualizamos la evaluación con las calificaciones cargadas
          this.evaluations[evaluationIndex] = {
            ...this.evaluations[evaluationIndex],
            studentGrades: grades,
            expanded: true
          };
        } else {
          console.error(`No se encontró la evaluación con ID: ${evaluationId}`);
        }
      });
  }

  // Método para expandir/colapsar una evaluación
  toggleEvaluationExpansion(evaluation: Evaluation): void {
    const expanded = !evaluation.expanded;
    
    // Si está expandiendo y no tiene calificaciones cargadas, cargarlas
    if (expanded && (!evaluation.studentGrades || evaluation.studentGrades.length === 0)) {
      this.loadEvaluationGrades(evaluation._id);
    } else {
      // Solo cambiar el estado de expansión
      evaluation.expanded = expanded;
    }
  }
} 