import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { Department } from '../models/department.model';

@Injectable({
  providedIn: 'root',
})
export class DepartmentService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all departments
   */
  getAllDepartments(): Observable<Department[]> {
    return this.apiService.get<Department[]>('departments');
  }

  /**
   * Get department by ID
   */
  getDepartmentById(departmentId: string): Observable<Department> {
    return this.apiService.get<Department>(`departments/${departmentId}`);
  }

  /**
   * Create a new department (admin only)
   */
  createDepartment(
    departmentData: Partial<Department>,
  ): Observable<Department> {
    return this.apiService.post<Department>('departments', departmentData);
  }

  /**
   * Update department (admin only)
   */
  updateDepartment(
    departmentId: string,
    departmentData: Partial<Department>,
  ): Observable<Department> {
    return this.apiService.patch<Department>(
      `departments/${departmentId}`,
      departmentData,
    );
  }

  /**
   * Delete department (admin only)
   */
  deleteDepartment(departmentId: string): Observable<any> {
    return this.apiService.delete<any>(`departments/${departmentId}`);
  }

  /**
   * Search departments by name
   */
  searchDepartments(name: string): Observable<Department[]> {
    return this.apiService.get<Department[]>('departments/search', { name });
  }

  /**
   * Get departments with professors count
   */
  getDepartmentsWithStats(): Observable<
    Array<Department & { professorCount: number; courseCount: number }>
  > {
    return this.apiService.get<
      Array<Department & { professorCount: number; courseCount: number }>
    >('departments/stats');
  }
}
