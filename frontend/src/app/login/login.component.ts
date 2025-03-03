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
import { AuthService } from '../services/auth.service';
import { FormFieldComponent } from '../components/shared/form-field/form-field.component';
import { NotificationService } from '../components/shared/notification/notification.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink, FormFieldComponent],
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  isSubmitting = false;
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.loginForm = this.fb.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to trigger validation messages
      Object.keys(this.loginForm.controls).forEach((key) => {
        const control = this.loginForm.get(key);
        control?.markAsTouched();
      });
      this.notificationService.warning(
        'Please enter both username and password.',
      );
      return;
    }

    this.isSubmitting = true;
    this.errorMessage = '';

    // Get credentials from form
    const credentials = {
      username: this.loginForm.get('username')?.value,
      password: this.loginForm.get('password')?.value,
    };

    console.log('Login credentials:', credentials);

    this.authService.login(credentials).subscribe({
      next: (response) => {
        this.notificationService.success('Login successful!');
        // AuthService will handle the redirection based on role
        this.isSubmitting = false;
      },
      error: (error) => {
        this.isSubmitting = false;
        console.error('Login error:', error);
        this.errorMessage =
          error.error?.message ||
          'Login failed. Please check your credentials.';
        this.notificationService.error(this.errorMessage);
      },
    });
  }

  navigateToRegister(): void {
    this.router.navigate(['/register']);
  }

  getControl(name: string): FormControl {
    return this.loginForm.get(name) as FormControl;
  }
}
