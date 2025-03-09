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
  @Output() delete = new EventEmitter<string>();
  @Output() view = new EventEmitter<string>();

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
   * Extracts the name of the prerequisite course
   * @param prereq The prerequisite course object
   * @returns The name of the prerequisite course
   */
  getPrerequisiteName(prereq: any): string {
    // Check if the prerequisite has a course name directly
    if (prereq.name) {
      return prereq.name;
    }

    // Check if the prerequisite has a prerequisiteCourseId with a name
    if (prereq.prerequisiteCourseId && prereq.prerequisiteCourseId.name) {
      return prereq.prerequisiteCourseId.name;
    }

    // Check if it's just a string ID reference
    if (typeof prereq === 'string') {
      return 'Course ID: ' + prereq;
    }

    return 'Unknown prerequisite';
  }

  /**
   * Emits the edit event with the current course
   */
  onEdit(): void {
    this.edit.emit(this.course);
  }

  /**
   * Emits the delete event with the course id
   */
  onDelete(): void {
    this.delete.emit(this.course._id);
  }

  /**
   * Emits the view event with the course id
   */
  onView(): void {
    this.view.emit(this.course._id);
  }
}
