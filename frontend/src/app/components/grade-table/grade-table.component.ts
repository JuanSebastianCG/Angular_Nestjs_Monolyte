import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import {
  StudentGrade,
  isStudentObject,
  isEvaluationObject,
} from '../../models/student-grade.model';
import { Student } from '../../models/student.model';
import { Evaluation } from '../../models/evaluation.model';

interface GradeEntry {
  studentId: string;
  studentName: string;
  grade: number | null;
  comments: string;
  original?: StudentGrade; // To track if this is an existing grade
  isEditing: boolean;
  hasChanges: boolean;
}

@Component({
  selector: 'app-grade-table',
  templateUrl: './grade-table.component.html',
  styleUrls: ['./grade-table.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
})
export class GradeTableComponent implements OnChanges {
  @Input() grades: StudentGrade[] = [];
  @Input() evaluation: Evaluation | null = null;
  @Input() enrolledStudents: any[] = []; // Students enrolled in the course
  @Input() canManage: boolean = false;

  @Output() saveGrade = new EventEmitter<{
    studentId: string;
    evaluationId: string;
    grade: number;
    comments?: string;
  }>();

  @Output() deleteGrade = new EventEmitter<{
    studentId: string;
    evaluationId: string;
  }>();

  gradeEntries: GradeEntry[] = [];

  ngOnChanges(changes: SimpleChanges): void {
    if (
      changes['grades'] ||
      changes['enrolledStudents'] ||
      changes['evaluation']
    ) {
      this.initializeGradeEntries();
    }
  }

  /**
   * Initialize grade entries from grades and enrolled students
   */
  initializeGradeEntries(): void {
    if (!this.evaluation) return;

    // Start with existing grades
    const entries: GradeEntry[] = this.grades.map((grade) => {
      const student = this.getStudentFromGrade(grade);
      return {
        studentId: isStudentObject(grade.studentId)
          ? grade.studentId._id
          : grade.studentId.toString(),
        studentName: this.getStudentName(student),
        grade: grade.grade,
        comments: grade.comments || '',
        original: grade,
        isEditing: false,
        hasChanges: false,
      };
    });

    // Add enrolled students without grades
    const gradedStudentIds = new Set(entries.map((e) => e.studentId));

    for (const enrollment of this.enrolledStudents) {
      const student = enrollment.studentId;
      if (student && !gradedStudentIds.has(student._id)) {
        entries.push({
          studentId: student._id,
          studentName: this.getStudentName(student),
          grade: null,
          comments: '',
          isEditing: false,
          hasChanges: false,
        });
      }
    }

    // Sort by student name
    this.gradeEntries = entries.sort((a, b) =>
      a.studentName.localeCompare(b.studentName),
    );
  }

  /**
   * Get student name from a student object
   */
  getStudentName(student: any): string {
    if (!student) return 'Unknown Student';

    if (student.userId) {
      const userId = student.userId;
      if (typeof userId === 'object') {
        return (
          userId.name || userId.username || userId.email || 'Unnamed Student'
        );
      }
    }

    return 'Student: ' + student._id;
  }

  /**
   * Get student from a grade
   */
  getStudentFromGrade(grade: StudentGrade): any {
    if (isStudentObject(grade.studentId)) {
      return grade.studentId;
    }
    return null;
  }

  /**
   * Start editing a grade
   */
  editGrade(entry: GradeEntry): void {
    entry.isEditing = true;
    // Store original values for comparing changes
    if (entry.original) {
      entry.grade = entry.original.grade;
      entry.comments = entry.original.comments || '';
    }
  }

  /**
   * Cancel editing a grade
   */
  cancelEdit(entry: GradeEntry): void {
    if (entry.original) {
      // Reset to original values
      entry.grade = entry.original.grade;
      entry.comments = entry.original.comments || '';
    } else {
      // For new grades, reset to null
      entry.grade = null;
      entry.comments = '';
    }
    entry.isEditing = false;
    entry.hasChanges = false;
  }

  /**
   * Save a grade
   */
  saveGradeChanges(entry: GradeEntry): void {
    if (!this.evaluation || entry.grade === null) return;

    this.saveGrade.emit({
      studentId: entry.studentId,
      evaluationId: this.evaluation._id!,
      grade: entry.grade,
      comments: entry.comments,
    });

    entry.isEditing = false;
    entry.hasChanges = false;
  }

  /**
   * Delete a grade
   */
  removeGrade(entry: GradeEntry): void {
    if (!this.evaluation || !entry.original) return;

    if (
      confirm(
        `Are you sure you want to delete the grade for ${entry.studentName}?`,
      )
    ) {
      this.deleteGrade.emit({
        studentId: entry.studentId,
        evaluationId: this.evaluation._id!,
      });
    }
  }

  /**
   * Check if the grade is passing (>= 60%)
   */
  isPassingGrade(entry: GradeEntry): boolean {
    if (entry.grade === null || !this.evaluation) return false;
    return entry.grade / this.evaluation.maxScore >= 0.6;
  }

  /**
   * Track changes in the form
   */
  onGradeChange(entry: GradeEntry): void {
    if (!entry.original) {
      entry.hasChanges = entry.grade !== null;
    } else {
      entry.hasChanges =
        entry.grade !== entry.original.grade ||
        entry.comments !== (entry.original.comments || '');
    }
  }
}
