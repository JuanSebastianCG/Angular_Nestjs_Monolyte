import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
} from '@angular/forms';
import { RouterModule } from '@angular/router';

import { Department } from '../../models/department.model';
import { DepartmentService } from '../../services/department.service';
import { UserService } from '../../services/user.service';
import { AuthService } from '../../services/auth.service';

import { AlertComponent } from '../../components/alert/alert.component';

@Component({
    selector: 'app-departments',
    standalone: true,
    imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterModule],
    templateUrl: './departments.component.html',
    styleUrls: ['./departments.component.scss'],
})
export class DepartmentsComponent implements OnInit {
    message: string = "I'm in departments";  
    departments: Department[] = [];
    loading = false;
    error = '';

    constructor(
        private departmentService: DepartmentService,
        private router: Router,
        private authService: AuthService
    ) {}

    ngOnInit(): void {
        if (!this.authService.isAuthenticated()) {
            this.router.navigate(['/login']);
            return;
        }
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
                this.error = 'Error al cargar los departamentos';
                this.loading = false;
            }
        });
    }
}


