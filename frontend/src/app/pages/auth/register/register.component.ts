import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { DepartmentService } from '../../../services/department.service';
import { finalize } from 'rxjs/operators';
import { FormFieldComponent } from '../../../components/form-field/form-field.component';
import { NotificationService } from '../../../components/shared/notification/notification.service';

interface Department {
  _id: string;
  name: string;
  description: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface StudentInfo {
  // Student-specific fields can be added here if needed
}

interface ProfessorInfo {
  departmentId: string;
  hiringDate: string;
}

interface UserData {
  name: string; // Full name
  username: string; // Login username
  email: string; // Email address
  birthDate: string;
  password: string;
  role: string; // "student" or "professor" (lowercase)
  studentInfo?: StudentInfo;
  professorInfo?: ProfessorInfo;
}

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormFieldComponent],
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';
  userTypes = ['Estudiante', 'Profesor'];
  userTypeOptions: SelectOption[] = [];
  departments: Department[] = [];
  departmentOptions: SelectOption[] = [];
  isLoadingDepartments = false;
  departmentError = '';
  showProfessorFields = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private departmentService: DepartmentService,
    private router: Router,
    private notificationService: NotificationService,
  ) {
    // Pre-compute options arrays
    this.userTypeOptions = this.userTypes.map((type) => ({
      value: type,
      label: type,
    }));
  }

  ngOnInit(): void {
    this.initForm();
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoadingDepartments = true;
    this.departmentError = '';

    this.departmentService
      .getAllDepartments()
      .pipe(
        finalize(() => {
          this.isLoadingDepartments = false;
        }),
      )
      .subscribe({
        next: (departments) => {
          this.departments = departments;
          // Update department options
          this.updateDepartmentOptions();
        },
        error: (error) => {
          this.departmentError = 'Error loading departments. Please try again.';
          this.notificationService.error(
            'Failed to load departments. Please try again later.',
          );
          console.error('Error loading departments:', error);
        },
      });
  }

  updateDepartmentOptions(): void {
    // Create base option first
    const baseOption: SelectOption = {
      value: '',
      label: 'Seleccione departamento',
    };

    // Map departments to options
    const deptOptions = this.departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    }));

    // Combine base option with department options
    this.departmentOptions = [baseOption, ...deptOptions];
  }

  initForm(): void {
    this.registerForm = this.fb.group(
      {
        name: ['', [Validators.required, Validators.minLength(3)]], // Full name
        username: ['', [Validators.required, Validators.minLength(3)]], // Login username
        email: ['', [Validators.required, Validators.email]], // Email address
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
        this.registerForm.get('departmentId')?.setValue(''); // Clear department value for students
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
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.registerForm.controls).forEach((key) => {
        const control = this.registerForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.warning(
        'Please correct all errors before submitting.',
      );
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Create a clean copy of the form values
    const formValues = this.registerForm.value;

    // Map role value to lowercase as expected by the API
    const roleMapping: { [key: string]: string } = {
      Estudiante: 'student',
      Profesor: 'professor',
    };

    const userData: UserData = {
      name: formValues.name,
      username: formValues.username,
      email: formValues.email,
      password: formValues.password,
      role: roleMapping[formValues.role], // Convert to lowercase as expected by API
      birthDate: formValues.birthDate,
    };

    // Add appropriate info based on the role
    if (userData.role === 'student') {
      userData.studentInfo = {};
    } else if (userData.role === 'professor') {
      userData.professorInfo = {
        departmentId: formValues.departmentId,
        hiringDate: new Date().toISOString().split('T')[0], // Today's date
      };
    }

    console.log('Submitting user data:', userData);

    this.authService.register(userData).subscribe({
      next: () => {
        this.notificationService.success(
          'Registration successful! You can now log in.',
        );
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Registration error:', error);
        this.errorMessage =
          error.error?.message || 'Registration failed. Please try again.';
        this.notificationService.error(this.errorMessage);
      },
    });
  }

  navigateToLogin(): void {
    this.router.navigate(['/login']);
  }

  getControl(name: string): FormControl {
    return this.registerForm.get(name) as FormControl;
  }
}
