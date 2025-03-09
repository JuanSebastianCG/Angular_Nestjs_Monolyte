import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import {
  AbstractControl,
  FormControl,
  ReactiveFormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class FormFieldComponent implements OnInit {
  @Input() control!: AbstractControl;
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() inputId: string = '';
  @Input() showSuccessIndicator: boolean = true;
  @Input() options: { value: string; label: string }[] = [];
  @Input() icon: string = '';
  @Input() multiple: boolean = false;
  @Output() selectionChange = new EventEmitter<string>();

  constructor() {}

  ngOnInit(): void {
    if (!this.inputId) {
      // Generate a random ID if not provided
      this.inputId = `field-${Math.random().toString(36).substring(2, 9)}`;
    }

    if (this.isSelect) {
      this.control.valueChanges.subscribe((value) => {
        this.selectionChange.emit(value);
      });
    }
  }

  get hasError(): boolean {
    const control = this.control;
    if (!control) return false;

    // Only show error if field is touched or dirty
    return (control.touched || control.dirty) && control.invalid;
  }

  get errorMessage(): string {
    if (!this.hasError) return '';

    const errors = this.control.errors || {};

    if (errors['required']) return 'This field is required';
    if (errors['email']) return 'Please enter a valid email address';
    if (errors['minlength'])
      return `Min length is ${errors['minlength'].requiredLength} characters`;
    if (errors['maxlength'])
      return `Max length is ${errors['maxlength'].requiredLength} characters`;
    if (errors['pattern']) return 'Please enter a valid format';
    if (errors['mustMatch']) return 'Passwords must match';

    return 'Invalid input';
  }

  get isValid(): boolean {
    const control = this.control;
    if (!control) return false;

    return (control.touched || control.dirty) && control.valid;
  }

  get isSelect(): boolean {
    return this.type === 'select';
  }

  get isDate(): boolean {
    return this.type === 'date';
  }
}
