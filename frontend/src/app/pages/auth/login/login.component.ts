import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormFieldComponent } from '../../../components/form-field/form-field.component';
import { AppButtonComponent } from '../../../components/app-button/app-button.component';
import { FormCardComponent } from '../../../components/form-card/form-card.component';
import { FormContainerComponent } from '../../../components/form-container/form-container.component';
import { AlertComponent } from '../../../components/alert/alert.component';

@Component({
  selector: 'app-login-page',
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
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})
export class LoginPageComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  submitted = false;
  error = '';
  returnUrl: string = '/';
  successMessage: string = '';

  constructor(
    private formBuilder: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService,
  ) {
    // Redirect if already logged in
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Get the success message if registration was successful
    this.successMessage = this.route.snapshot.queryParams['registered']
      ? 'Registration successful! Please log in.'
      : '';
  }

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      username: ['', Validators.required],
      password: ['', Validators.required],
    });

    // Get return url from route parameters or default to '/'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  // Convenience getter for easy access to form fields
  get f() {
    return this.loginForm.controls;
  }

  onSubmit() {
    this.submitted = true;
    this.error = '';

    // stop here if form is invalid
    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    this.authService.login(this.loginForm.value).subscribe({
      next: () => {
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        this.error =
          error.error?.message ||
          'Login failed. Please check your credentials.';
        this.loading = false;
      },
    });
  }

  /**
   * Navigate to the register page programmatically
   */
  navigateToRegister() {
    this.router.navigate(['/register']);
  }

  clearError() {
    this.error = '';
  }

  clearSuccessMessage() {
    this.successMessage = '';
  }
}
