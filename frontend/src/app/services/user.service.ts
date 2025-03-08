import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';
import { User, UserProfessor, UserStudent } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  constructor(private apiService: ApiService) {}

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.apiService.get<User[]>('users');
  }

  /**
   * Get all professors
   */
  getAllProfessors(): Observable<UserProfessor[]> {
    return this.apiService.get<UserProfessor[]>('professors');
  }

  /**
   * Get all students
   */
  getAllStudents(): Observable<UserStudent[]> {
    return this.apiService.get<UserStudent[]>('students');
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User> {
    return this.apiService.get<User>(`users/${userId}`);
  }

  /**
   * Get user by username (admin only)
   */
  getUserByUsername(username: string): Observable<User> {
    return this.apiService.get<User>(`users/username/${username}`);
  }

  /**
   * Update user
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.apiService.patch<User>(`users/${userId}`, userData);
  }

  /**
   * Update user with professor info
   */
  updateProfessor(
    userId: string,
    userData: Partial<UserProfessor>,
  ): Observable<UserProfessor> {
    return this.apiService.patch<UserProfessor>(`users/${userId}`, userData);
  }

  /**
   * Update user with student info
   */
  updateStudent(
    userId: string,
    userData: Partial<UserStudent>,
  ): Observable<UserStudent> {
    return this.apiService.patch<UserStudent>(`users/${userId}`, userData);
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: string): Observable<any> {
    return this.apiService.delete<any>(`users/${userId}`);
  }

  /**
   * Search users by name or email
   */
  searchUsers(query: string): Observable<User[]> {
    return this.apiService.get<User[]>('users/search', { query });
  }

  /**
   * Get professors by department
   */
  getProfessorsByDepartment(departmentId: string): Observable<UserProfessor[]> {
    return this.apiService.get<UserProfessor[]>(
      `professors/department/${departmentId}`,
    );
  }
}
