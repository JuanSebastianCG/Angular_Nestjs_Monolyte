import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { DepartmentService } from '../../../services/department.service';
import { FormFieldComponent } from '../../../components/form-field/form-field.component';
import { Department } from '../../../models/department.model';

// Import custom components
import { AppButtonComponent } from '../../../components/app-button/app-button.component';
import { FormCardComponent } from '../../../components/form-card/form-card.component';
import { FormContainerComponent } from '../../../components/form-container/form-container.component';
import { AlertComponent } from '../../../components/alert/alert.component';

@Component({
  selector: 'app-register-page',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
    FormFieldComponent,
    AppButtonComponent,
    FormCardComponent,
    FormContainerComponent,
    AlertComponent,
  ],
})
export class RegisterPageComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  roles = ['student', 'professor'];
  selectedRole = 'profesor'; // Default role
  departments: Department[] = [];
  loadingDepartments = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private departmentService: DepartmentService,
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  ngOnInit() {
    this.registerForm = this.formBuilder.group(
      {
        username: ['', Validators.required],
        name: ['', Validators.required],
        email: ['', [Validators.required, Validators.email]],
        role: ['profesor', Validators.required],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        birthDate: ['', Validators.required],
        departmentId: [''],
        hiringDate: [''],
      },
      {
        validator: this.mustMatch('password', 'confirmPassword'),
      },
    );

    this.loadDepartments();
    this.updateValidators();

    // Listen for role changes
    this.registerForm.get('role')?.valueChanges.subscribe((role) => {
      this.onRoleChange(role);
    });
  }

  /**
   * Navigate to the login page programmatically
   */
  navigateToLogin() {
    this.router.navigate(['/login']);
  }

  onRoleChange(role: string): void {
    this.selectedRole = role;
    this.updateValidators();
  }

  handleRoleChange(event: any): void {
    const role = event?.target?.value || event;
    this.onRoleChange(role);
  }

  loadDepartments() {
    this.loadingDepartments = true;
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
        this.loadingDepartments = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.loadingDepartments = false;
      },
    });
  }

  updateValidators() {
    const departmentId = this.registerForm.get('departmentId');
    const hiringDate = this.registerForm.get('hiringDate');

    if (this.selectedRole === 'profesor') {
      departmentId?.setValidators([Validators.required]);
      hiringDate?.setValidators([Validators.required]);
    } else {
      departmentId?.clearValidators();
      hiringDate?.clearValidators();
    }

    departmentId?.updateValueAndValidity();
    hiringDate?.updateValueAndValidity();
  }

  mustMatch(controlName: string, matchingControlName: string) {
    return (formGroup: FormGroup) => {
      const control = formGroup.controls[controlName];
      const matchingControl = formGroup.controls[matchingControlName];

      if (matchingControl.errors && !matchingControl.errors['mustMatch']) {
        // return if another validator has already found an error
        return;
      }

      // set error on matchingControl if validation fails
      if (control.value !== matchingControl.value) {
        matchingControl.setErrors({ mustMatch: true });
      } else {
        matchingControl.setErrors(null);
      }
    };
  }

  get f() {
    return this.registerForm.controls;
  }

  get departmentOptions(): Array<{ value: string; label: string }> {
    return this.departments.map((dept) => ({
      value: dept._id,
      label: dept.name,
    }));
  }

  onSubmit() {
    this.submitted = true;
    this.clearError();

    // stop here if form is invalid
    if (this.registerForm.invalid) {
      return;
    }

    this.loading = true;

    // Preparar datos según formato API
    const userData = {
      name: this.f['name'].value,
      birthDate: this.f['birthDate'].value,
      username: this.f['username'].value,
      email: this.f['email'].value,
      password: this.f['password'].value,
      role: this.selectedRole === 'profesor' ? 'professor' : 'student',
    };

    if (this.selectedRole === 'profesor') {
      this.registerProfessor(userData);
    } else {
      this.registerStudent(userData);
    }
  }

  registerProfessor(userData: any) {
    // Agregar información específica de profesor
    userData.professorInfo = {
      departmentId: this.f['departmentId'].value,
      hiringDate:
        this.f['hiringDate'].value || new Date().toISOString().split('T')[0],
    };

    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { registered: true },
        });
      },
      error: (error) => {
        this.error = error;
        this.loading = false;
      },
    });
  }

  registerStudent(userData: any) {
    // Agregar información específica de estudiante
    userData.studentInfo = {};

    this.authService.register(userData).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          queryParams: { registered: true },
        });
      },
      error: (error) => {
        this.error = error;
        this.loading = false;
      },
    });
  }

  clearError() {
    this.error = '';
  }
}
