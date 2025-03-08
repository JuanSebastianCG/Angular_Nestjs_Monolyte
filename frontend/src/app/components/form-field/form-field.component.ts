import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-form-field',
  templateUrl: './form-field.component.html',
  styleUrls: ['./form-field.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
})
export class FormFieldComponent implements OnInit {
  @Input() control!: FormControl;
  @Input() label!: string;
  @Input() placeholder: string = '';
  @Input() type: string = 'text';
  @Input() inputId: string = '';
  @Input() showSuccessIndicator: boolean = true;
  @Input() options: { value: string; label: string }[] = [];
  @Input() icon: string = '';

  constructor() {}

  ngOnInit(): void {
    // Generate a unique ID if none is provided
    if (!this.inputId) {
      this.inputId = 'input_' + Math.random().toString(36).substring(2, 9);
    }
  }

  get hasError(): boolean {
    return (
      this.control &&
      this.control.invalid &&
      (this.control.dirty || this.control.touched)
    );
  }

  get errorMessage(): string {
    if (!this.hasError) return '';

    const errors = this.control.errors || {};

    if (errors['required']) return 'Este campo es requerido';
    if (errors['email']) return 'Ingrese un correo electrónico válido';
    if (errors['minlength'])
      return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    if (errors['maxlength'])
      return `Máximo ${errors['maxlength'].requiredLength} caracteres`;
    if (errors['pattern']) return 'Formato inválido';
    if (errors['passwordMismatch']) return 'Las contraseñas no coinciden';

    return 'Campo inválido';
  }

  get isValid(): boolean {
    return (
      this.control &&
      this.control.valid &&
      (this.control.dirty || this.control.touched)
    );
  }

  get isSelect(): boolean {
    return this.type === 'select';
  }

  get isDate(): boolean {
    return this.type === 'date';
  }
}
