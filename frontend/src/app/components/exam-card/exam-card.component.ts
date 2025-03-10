import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Evaluation } from '../../models/evaluation.model';

@Component({
  selector: 'app-exam-card',
  templateUrl: './exam-card.component.html',
  styleUrls: ['./exam-card.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class ExamCardComponent {
  @Input() exam!: Evaluation;
  @Input() canManage: boolean = false;

  @Output() edit = new EventEmitter<Evaluation>();
  @Output() delete = new EventEmitter<Evaluation>();

  /**
   * Format the date for display
   */
  get formattedDate(): string {
    if (!this.exam?.evaluationDate) {
      return 'N/A';
    }

    try {
      const date = new Date(this.exam.evaluationDate);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Date Error';
    }
  }

  /**
   * Edit the exam
   */
  editExam(): void {
    this.edit.emit(this.exam);
  }

  /**
   * Delete the exam
   */
  deleteExam(): void {
    if (
      confirm(`Are you sure you want to delete the exam "${this.exam.name}"?`)
    ) {
      this.delete.emit(this.exam);
    }
  }
}
