import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

interface Department {
  _id: string;
  name: string;
  description: string;
}

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  private endpoint = 'departments';

  constructor(private apiService: ApiService) {}

  // Get all departments
  getAllDepartments(): Observable<Department[]> {
    return this.apiService.get<Department[]>(this.endpoint);
  }

  // Get department by ID
  getDepartmentById(id: string): Observable<Department> {
    return this.apiService.get<Department>(`${this.endpoint}/${id}`);
  }

  // Create a new department
  createDepartment(
    department: Omit<Department, '_id'>,
  ): Observable<Department> {
    return this.apiService.post<Department>(this.endpoint, department);
  }

  // Update department
  updateDepartment(
    id: string,
    department: Partial<Department>,
  ): Observable<Department> {
    return this.apiService.patch<Department>(
      `${this.endpoint}/${id}`,
      department,
    );
  }

  // Delete department
  deleteDepartment(id: string): Observable<any> {
    return this.apiService.delete<any>(`${this.endpoint}/${id}`);
  }

  // Search departments by name
  searchDepartments(name: string): Observable<Department[]> {
    return this.apiService.get<Department[]>(`${this.endpoint}/search`, {
      name,
    });
  }
}
