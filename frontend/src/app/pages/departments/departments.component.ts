import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

import { AlertComponent } from '../../components/alert/alert.component';
import { ModalComponent } from '../../components/modal/modal.component';
import { FormFieldComponent } from '../../components/form-field/form-field.component';
import { AppButtonComponent } from '../../components/app-button/app-button.component';

@Component({
    selector: 'app-departments',
    standalone: true,
    imports: [
        CommonModule, 
        FormsModule, 
        ReactiveFormsModule, 
        RouterModule,
        AlertComponent,
        ModalComponent,
        FormFieldComponent,
        AppButtonComponent
    ],
    templateUrl: './departments.component.html',
    styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit {
    message: string = "I'm in departments";  
    departments: Department[] = [];
    loading = false;
    error = '';
    success = '';
    showCreateModal = false;
    showEditModal = false;
    showDeleteModal = false;
    departmentForm: FormGroup;
    selectedDepartment: Department | null = null;

    constructor(
        private departmentService: DepartmentService,
        private router: Router,
        private authService: AuthService,
        private formBuilder: FormBuilder
    ) {
        this.departmentForm = this.formBuilder.group({
            name: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.required, Validators.minLength(10)]]
        });
    }

    get nameControl(): AbstractControl {
        return this.departmentForm.get('name')!;
    }

    get descriptionControl(): AbstractControl {
        return this.departmentForm.get('description')!;
    }

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
        
        // Agregar logs para depuración
        const currentUser = this.authService.getCurrentUser();
        console.log('Usuario actual:', currentUser);
        console.log('¿Es admin?:', this.authService.isAdmin());
        console.log('¿Puede gestionar departamentos?:', this.canManageDepartments);
        
        this.loadDepartments();
    }

    loadDepartments(): void {
        this.loading = true;
        this.departmentService.getAllDepartments().subscribe({
            next: (departments) => {
                this.departments = departments;
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Error loading departments';
                this.loading = false;
            }
        });
    }

    get canManageDepartments(): boolean {
        return this.authService.isAdmin() || this.authService.isProfessor();
    }

    openCreateModal(): void {
        if (!this.canManageDepartments) {
            this.error = 'You do not have permission to create departments. Only administrators and professors can perform this action.';
            return;
        }
        this.departmentForm.reset();
        this.showCreateModal = true;
    }

    openEditModal(department: Department): void {
        if (!this.canManageDepartments) {
            this.error = 'You do not have permission to edit departments. Only administrators and professors can perform this action.';
            return;
        }
        this.selectedDepartment = department;
        this.departmentForm.patchValue({
            name: department.name,
            description: department.description
        });
        this.showEditModal = true;
    }

    openDeleteModal(department: Department): void {
        if (!this.canManageDepartments) {
            this.error = 'You do not have permission to delete departments. Only administrators and professors can perform this action.';
            return;
        }
        this.selectedDepartment = department;
        this.showDeleteModal = true;
    }

    closeModals(): void {
        this.showCreateModal = false;
        this.showEditModal = false;
        this.showDeleteModal = false;
        this.selectedDepartment = null;
        this.departmentForm.reset();
    }

    createDepartment(): void {
        if (this.departmentForm.invalid) {
            return;
        }

        this.loading = true;
        const formValue = this.departmentForm.value;

        this.departmentService.createDepartment(formValue).subscribe({
            next: () => {
                this.success = 'Department created successfully';
                this.loadDepartments();
                this.closeModals();
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Error creating department';
                this.loading = false;
            }
        });
    }

    updateDepartment(): void {
        if (this.departmentForm.invalid || !this.selectedDepartment) {
            return;
        }

        this.loading = true;
        const formValue = this.departmentForm.value;

        this.departmentService.updateDepartment(this.selectedDepartment._id, formValue).subscribe({
            next: () => {
                this.success = 'Department updated successfully';
                this.loadDepartments();
                this.closeModals();
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Error updating department';
                this.loading = false;
            }
        });
    }

    deleteDepartment(): void {
        if (!this.selectedDepartment) {
            return;
        }

        this.loading = true;
        this.departmentService.deleteDepartment(this.selectedDepartment._id).subscribe({
            next: () => {
                this.success = 'Department deleted successfully';
                this.loadDepartments();
                this.closeModals();
                this.loading = false;
            },
            error: (error) => {
                this.error = 'Error deleting department';
                this.loading = false;
            }
        });
    }

    clearMessages(): void {
        this.error = '';
        this.success = '';
    }
}


