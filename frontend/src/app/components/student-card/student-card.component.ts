import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Enrollment } from '../../models/enrollment.model';

@Component({
  selector: 'app-student-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student-card.component.html',
  styleUrls: ['./student-card.component.scss'],
})
export class StudentCardComponent {
  @Input() enrollment!: Enrollment;
  @Input() canManage: boolean = false;

  @Output() remove = new EventEmitter<Enrollment>();

  /**
   * Remove student from the course
   */
  removeStudent(): void {
    this.remove.emit(this.enrollment);
  }

  /**
   * Get student full name
   */
  get studentName(): string {
    if (!this.enrollment?.studentId) return 'Unknown Student';

    // Access the student info from the enrollment
    const student = this.enrollment.studentId;

    if (typeof student === 'object') {
      // Check if we have a nested userId object with name
      if (student.userId && typeof student.userId === 'object') {
        const userId = student.userId as any;
        return userId.name || userId.username || 'No Name';
      }

      // Use type assertions to access properties safely
      const studentAny = student as any;

      // Try to get username
      if ('username' in student && typeof studentAny.username === 'string') {
        return studentAny.username;
      }

      // Try to get email
      if ('email' in student && typeof studentAny.email === 'string') {
        return studentAny.email;
      }
    }

    return 'Student ID: ' + (typeof student === 'string' ? student : 'Unknown');
  }

  /**
   * Get enrollment status formatted
   */
  get status(): string {
    // Safely get status with default value and ensure it's a string
    if (!this.enrollment) return 'UNKNOWN';

    const status = this.enrollment.status;
    if (typeof status !== 'string') return 'UNKNOWN';

    return status.toUpperCase();
  }

  /**
   * Get enrollment date formatted
   */
  get enrollmentDate(): string {
    if (!this.enrollment) return 'N/A';

    const startDate = this.enrollment.enrollmentStartDate;
    if (!startDate) return 'N/A';

    try {
      // Make sure we have a valid date string
      const date = new Date(startDate);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString();
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Date Error';
    }
  }
}
