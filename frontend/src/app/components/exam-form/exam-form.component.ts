import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Evaluation } from '../../models/evaluation.model';

@Component({
  selector: 'app-exam-form',
  templateUrl: './exam-form.component.html',
  styleUrls: ['./exam-form.component.scss'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class ExamFormComponent implements OnInit {
  @Input() exam: Evaluation | null = null;
  @Input() courseId: string = '';
  @Input() isVisible: boolean = false;

  @Output() save = new EventEmitter<Partial<Evaluation>>();
  @Output() cancel = new EventEmitter<void>();

  examForm!: FormGroup;
  isEditMode: boolean = false;
  formTitle: string = 'Create New Exam';

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initForm();
  }

  /**
   * Initialize the form
   */
  initForm(): void {
    this.examForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]],
      maxScore: [
        100,
        [Validators.required, Validators.min(0), Validators.max(100)],
      ],
      evaluationDate: ['', [Validators.required]],
    });

    // Check if we are in edit mode
    if (this.exam) {
      this.isEditMode = true;
      this.formTitle = 'Edit Exam';
      this.populateForm();
    }
  }

  /**
   * Populate the form with exam data
   */
  populateForm(): void {
    if (!this.exam) return;

    // Format the date from ISO string to yyyy-MM-dd for the input field
    const date = this.exam.evaluationDate
      ? new Date(this.exam.evaluationDate).toISOString().split('T')[0]
      : '';

    this.examForm.patchValue({
      name: this.exam.name,
      description: this.exam.description || '',
      maxScore: this.exam.maxScore,
      evaluationDate: date,
    });
  }

  /**
   * Submit the form
   */
  onSubmit(): void {
    if (this.examForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.examForm.controls).forEach((key) => {
        const control = this.examForm.get(key);
        control?.markAsTouched();
      });
      return;
    }

    const examData: Partial<Evaluation> = {
      ...this.examForm.value,
      courseId: this.courseId,
    };

    // If we're editing, include the id
    if (this.isEditMode && this.exam) {
      examData._id = this.exam._id;
    }

    this.save.emit(examData);
  }

  /**
   * Cancel the form
   */
  onCancel(): void {
    this.examForm.reset();
    this.cancel.emit();
  }

  /**
   * Reset the form
   */
  resetForm(): void {
    this.examForm.reset();
    this.examForm.patchValue({
      maxScore: 100,
    });
    this.isEditMode = false;
    this.formTitle = 'Create New Exam';
    this.exam = null;
  }
}
