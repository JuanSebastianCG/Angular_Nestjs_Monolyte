import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { DepartmentService } from '../services/department.service';

interface Department {
  _id: string;
  name: string;
  description: string;
}

@Component({
  selector: 'app-departamentos',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <div class="min-h-screen flex flex-col bg-gray-50">
      <!-- Header with role and user info -->
      <header class="bg-white p-4 border-b border-gray-200">
        <div class="container mx-auto flex justify-between items-center">
          <div class="text-xl font-semibold text-gray-700">
            Admin - Departamentos
          </div>
          <div class="flex items-center">
            <span class="mr-4 text-gray-700">{{ userName }}</span>
            <button
              (click)="logout()"
              class="flex items-center text-gray-600 hover:text-red-600"
            >
              Cerrar sesión
              <svg
                class="w-5 h-5 ml-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                ></path>
              </svg>
            </button>
          </div>
        </div>
      </header>

      <!-- Navigation Menu -->
      <nav class="bg-white shadow-sm">
        <div class="container mx-auto">
          <ul class="flex">
            <li class="mr-1">
              <a
                routerLink="/home"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Home
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/cursos"
                routerLinkActive="border-b-2 border-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Cursos
              </a>
            </li>
            <li class="mr-1">
              <a
                routerLink="/departamentos"
                routerLinkActive="border-b-2 border-blue-600 text-blue-600"
                class="block py-4 px-4 text-gray-700 hover:text-blue-600"
              >
                Departamentos
              </a>
            </li>
          </ul>
        </div>
      </nav>

      <!-- Main Content -->
      <main class="container mx-auto py-6 px-4">
        <!-- Create Department Button -->
        <div class="mb-6">
          <button
            class="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            (click)="createNewDepartment()"
          >
            Crear Departamento
          </button>
        </div>

        <!-- Loading indicator -->
        <div *ngIf="isLoading" class="text-center p-8">
          <p class="text-gray-600">Cargando departamentos...</p>
        </div>

        <!-- Error message -->
        <div
          *ngIf="errorMessage"
          class="bg-red-100 text-red-700 p-4 rounded-lg mb-6"
        >
          {{ errorMessage }}
          <button
            (click)="loadDepartments()"
            class="ml-2 text-blue-600 underline hover:text-blue-800"
          >
            Reintentar
          </button>
        </div>

        <!-- Departments Grid -->
        <div
          *ngIf="!isLoading && !errorMessage"
          class="grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          <div
            *ngFor="let dept of departments"
            class="bg-white p-4 rounded-md shadow-sm border border-gray-200 relative"
          >
            <!-- Department Title -->
            <h3 class="text-lg font-medium text-gray-800">{{ dept.name }}</h3>
            <p class="text-gray-600 mt-2">{{ dept.description }}</p>

            <!-- Edit and Delete buttons -->
            <div class="absolute top-3 right-3 flex space-x-2">
              <button
                (click)="editDepartment(dept._id)"
                class="text-blue-500 hover:text-blue-700"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  ></path>
                </svg>
              </button>

              <button
                (click)="deleteDepartment(dept._id)"
                class="text-red-500 hover:text-red-700"
              >
                <svg
                  class="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  ></path>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <!-- No departments message -->
        <div
          *ngIf="!isLoading && !errorMessage && departments.length === 0"
          class="text-center p-8"
        >
          <p class="text-gray-600">No hay departamentos disponibles</p>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class DepartamentosComponent implements OnInit {
  departments: Department[] = [];
  userName: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';

  constructor(
    private authService: AuthService,
    private departmentService: DepartmentService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Get the user data from auth service
    const currentUser = this.authService.currentUserValue;
    this.userName = currentUser?.name || '';

    // Only admins should access this page
    if (currentUser?.role?.toLowerCase() !== 'admin') {
      this.router.navigate(['/home']);
      return;
    }

    // Load departments
    this.loadDepartments();
  }

  loadDepartments(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.departmentService.getAllDepartments().subscribe({
      next: (apiDepartments) => {
        this.departments = apiDepartments;
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading departments:', error);
        this.errorMessage =
          'No se pudieron cargar los departamentos. Por favor intente de nuevo.';
        this.isLoading = false;
      },
    });
  }

  logout(): void {
    this.authService.logout();
  }

  createNewDepartment(): void {
    console.log('Create new department');
    // This would typically open a form or navigate to a department creation page
    // For now, just mock a new department creation
    const newDepartment = {
      name: 'Nuevo Departamento',
      description: 'Descripción del nuevo departamento',
    };

    this.departmentService.createDepartment(newDepartment).subscribe({
      next: (department) => {
        this.departments.push(department);
      },
      error: (error) => {
        console.error('Error creating department:', error);
        // Show error notification
      },
    });
  }

  editDepartment(departmentId: string): void {
    console.log('Edit department:', departmentId);
    // This would typically open a form or navigate to a department edit page
    // For now just log the action
  }

  deleteDepartment(departmentId: string): void {
    console.log('Delete department:', departmentId);

    this.departmentService.deleteDepartment(departmentId).subscribe({
      next: () => {
        // Remove the department from the list
        this.departments = this.departments.filter(
          (dept) => dept._id !== departmentId,
        );
      },
      error: (error) => {
        console.error('Error deleting department:', error);
        // Show error notification
      },
    });
  }
}
