import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../models/course.model';

@Component({
  selector: 'app-course-card',
  templateUrl: './course-card.component.html',
  styleUrls: ['./course-card.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() showActions: boolean = true;

  @Output() edit = new EventEmitter<Course>();
  @Output() delete = new EventEmitter<Course>();
  @Output() view = new EventEmitter<Course>();

  /**
   * Returns formatted schedule days
   */
  get scheduleDays(): string {
    if (!this.course?.scheduleId?.days) return 'No scheduled days';
    return this.course.scheduleId.days.join(', ');
  }

  /**
   * Returns formatted schedule time
   */
  get scheduleTime(): string {
    if (!this.course?.scheduleId) return 'No schedule';
    return `${this.course.scheduleId.startTime} - ${this.course.scheduleId.endTime}`;
  }

  /**
   * Returns the room where classes are held
   */
  get room(): string {
    return this.course?.scheduleId?.room || 'No room assigned';
  }

  /**
   * Returns the professor name if available
   */
  get professorName(): string {
    if (!this.course.professorId) return 'No professor assigned';

    // If professorId is an object with a name property
    if (
      typeof this.course.professorId === 'object' &&
      this.course.professorId.name
    ) {
      return this.course.professorId.name;
    }

    // Otherwise just return the ID
    return 'Professor ID: ' + this.course.professorId;
  }

  /**
   * Extracts the name of the prerequisite course
   * @param prereq The prerequisite course object
   * @returns The name of the prerequisite course
   */
  getPrerequisiteName(prereq: any): string {
    // Add debug logging
    // If the prerequisite is a full course object with a name
    if (prereq && prereq.name) {
      return prereq.name;
    }

    // If it has a prerequisiteCourseId property that is an object
    if (prereq && prereq.prerequisiteCourseId) {
      if (
        typeof prereq.prerequisiteCourseId === 'object' &&
        prereq.prerequisiteCourseId !== null &&
        prereq.prerequisiteCourseId.name
      ) {
        return prereq.prerequisiteCourseId.name;
      }
      // If prerequisiteCourseId is a string ID
      if (typeof prereq.prerequisiteCourseId === 'string') {
        return 'Course ID: ' + prereq.prerequisiteCourseId;
      }
    }

    // If it's just a string ID
    if (typeof prereq === 'string') {
      return 'Course ID: ' + prereq;
    }

    return 'Unknown prerequisite';
  }

  /**
   * Handle edit button click
   */
  onEdit(): void {
    this.edit.emit(this.course);
  }

  /**
   * Handle delete button click
   */
  onDelete(): void {
    this.delete.emit(this.course);
  }

  /**
   * Handle view button click
   */
  onView(): void {
    this.view.emit(this.course);
  }
}
