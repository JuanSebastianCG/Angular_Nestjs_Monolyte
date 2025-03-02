import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  userTypes = ['Estudiante', 'Profesor'];
  departments = ['Matemática', 'Física', 'Química', 'Biología', 'Informática'];
  showProfessorFields = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.registerForm = this.fb.group(
      {
        username: ['', Validators.required],
        password: ['', [Validators.required, Validators.minLength(8)]],
        confirmPassword: ['', Validators.required],
        role: ['Estudiante', Validators.required],
        birthDate: ['', Validators.required],
        departmentId: [''],
      },
      { validators: this.passwordMatchValidator },
    );

    // Subscribe to role changes to show/hide professor fields
    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      this.showProfessorFields = role === 'Profesor';
      if (this.showProfessorFields) {
        this.registerForm
          .get('departmentId')
          ?.setValidators(Validators.required);
      } else {
        this.registerForm.get('departmentId')?.clearValidators();
      }
      this.registerForm.get('departmentId')?.updateValueAndValidity();
    });
  }

  // Custom validator to check if passwords match
  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    const { confirmPassword, ...userData } = this.registerForm.value;

    // Add appropriate info based on the role
    if (userData.role === 'Estudiante') {
      userData.studentInfo = {
        enrollmentDate: new Date().toISOString().split('T')[0], // Today's date
      };
    } else if (userData.role === 'Profesor') {
      userData.professorInfo = {
        departmentId: userData.departmentId,
        hiringDate: new Date().toISOString().split('T')[0], // Today's date
      };
    }

    // Remove departmentId from the root level before sending
    if (userData.role === 'Profesor') {
      delete userData.departmentId;
    }

    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isSubmitting = false;
        this.errorMessage =
          error.error?.message || 'Registration failed. Please try again.';
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }
}
