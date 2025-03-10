import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
} from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { UserService } from '../../services/user.service';
import { User, UserProfessor, UserStudent } from '../../models/user.model';
import { DepartmentService } from '../../services/department.service';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { AppButtonComponent } from '../../components/app-button/app-button.component';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    ReactiveFormsModule, 
    FormFieldComponent,
    AppButtonComponent
  ],
})
export class ProfileComponent implements OnInit {
  // User data
  userData: User | null = null;
  userProfileForm: FormGroup;

  // UI state
  isLoading: boolean = false;
  isEditing: boolean = false;
  saveSuccess: boolean = false;
  saveError: string = '';

  // Department data for professors
  departments: any[] = [];

  constructor(
    private authService: AuthService,
    private userService: UserService,
    private departmentService: DepartmentService,
    private fb: FormBuilder,
  ) {
    // Initialize form with empty values
    this.userProfileForm = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      birthDate: [''],

      // Professor-specific fields
      hiringDate: [''],
      departmentId: [''],

      // Student-specific fields
      // Add any student fields here if needed in the future
    });
  }

  ngOnInit(): void {
    this.loadUserProfile();

    // If user is a professor, load departments for dropdown
    if (this.authService.isProfessor()) {
      this.loadDepartments();
    }
  }

  /**
   * Load the user's profile from the API
   */
  loadUserProfile(): void {
    this.isLoading = true;
    this.authService.getProfile().subscribe({
      next: (profile) => {
        this.userData = profile;
        this.populateForm(profile);
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading profile:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Load departments for professor dropdown
   */
  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe({
      next: (departments) => {
        this.departments = departments;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
      },
    });
  }

  /**
   * Populate form with user data
   */
  populateForm(user: User): void {
    // Format date for input field (YYYY-MM-DD)
    const birthDate = user.birthDate
      ? new Date(user.birthDate).toISOString().split('T')[0]
      : '';

    // Update common user fields
    this.userProfileForm.patchValue({
      name: user.name || '',
      email: user.email || '',
      birthDate,
    });

    // Handle professor-specific fields
    if (this.authService.isProfessor() && this.isProfessor(user)) {
      const professorInfo = user.professorInfo;

      if (professorInfo) {
        const hiringDate = professorInfo.hiringDate
          ? new Date(professorInfo.hiringDate).toISOString().split('T')[0]
          : '';

        this.userProfileForm.patchValue({
          hiringDate,
          departmentId: professorInfo.departmentId || '',
        });
      }
    }

    // Handle student-specific fields if needed in the future
  }

  /**
   * Type guard for professor
   */
  isProfessor(user: User): user is UserProfessor {
    return user.role === 'professor' && 'professorInfo' in user;
  }

  /**
   * Type guard for student
   */
  isStudent(user: User): user is UserStudent {
    return user.role === 'student' && 'studentInfo' in user;
  }

  /**
   * Enable form editing
   */
  enableEditing(): void {
    this.isEditing = true;
    this.saveSuccess = false;
    this.saveError = '';
  }

  /**
   * Cancel editing and reset form
   */
  cancelEditing(): void {
    this.isEditing = false;
    if (this.userData) {
      this.populateForm(this.userData);
    }
  }

  /**
   * Save user profile changes
   */
  saveProfile(): void {
    if (this.userProfileForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.saveError = '';

    const formValues = this.userProfileForm.value;
    const updateData: any = {
      name: formValues.name,
      email: formValues.email,
      birthDate: formValues.birthDate,
    };

    // Add professor-specific fields if user is a professor
    if (
      this.authService.isProfessor() &&
      this.userData &&
      this.isProfessor(this.userData)
    ) {
      updateData.professorInfo = {
        hiringDate: formValues.hiringDate,
      };

      if (formValues.departmentId) {
        updateData.professorInfo.departmentId = formValues.departmentId;
      }
    }

    // Get current user to make sure we have the ID
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) {
      this.saveError = 'Unable to identify user. Please try logging in again.';
      this.isLoading = false;
      return;
    }

    // Verificar que haya un ID y obtenerlo correctamente
    let userId = '';
    
    // Intentar obtener el ID solo como _id (no hay propiedad id en User)
    if (currentUser && currentUser._id) {
      userId = currentUser._id;
    } else if (this.userData && this.userData._id) {
      userId = this.userData._id;
    }
    
    if (!userId) {
      this.saveError = 'User ID not found. Please try logging in again.';
      this.isLoading = false;
      console.error('No user ID found in:', { currentUser, userData: this.userData });
      return;
    }

    console.log(`Updating profile for user with ID: ${userId}`);

    // Save the profile with explicit user ID
    this.userService.updateUserProfile(userId, updateData).subscribe({
      next: (updatedUser) => {
        this.userData = updatedUser;
        this.saveSuccess = true;
        this.isEditing = false;
        this.saveError = '';
        this.isLoading = false;

        // Actualizar el currentUserSubject en el authService
        // El BehaviorSubject está expuesto como Observable, pero internamente se actualiza
        this.authService.updateCurrentUser(updatedUser);
      },
      error: (error) => {
        console.error('Error updating profile:', error);
        this.saveError = error.error?.message || 'Failed to update profile. Please try again.';
        this.isLoading = false;
      },
    });
  }

  /**
   * Format date for display
   */
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString();
  }

  /**
   * Mapear departamentos a opciones para el selector
   */
  get departmentOptions(): { value: string; label: string }[] {
    if (!this.departments || !this.departments.length) {
      return [];
    }
    return this.departments.map(dept => ({ 
      value: dept._id, 
      label: dept.name 
    }));
  }
}
