import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { User, UserProfessor, UserStudent } from '../models/user.model';
import { Professor } from '../models/professor.model';
import { Student } from '../models/student.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = `${environment.apiUrl}/users`;
  private professorsUrl = `${environment.apiUrl}/professors`;

  constructor(private http: HttpClient) {}

  /**
   * Get all users (admin only)
   */
  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`);
  }

  /**
   * Get all professors with their user and department info
   * According to the API: GET /professors/
   * Returns professor objects with nested userId and departmentId objects
   */
  getAllProfessors(): Observable<Professor[]> {
    return this.http.get<Professor[]>(`${this.professorsUrl}`);
  }

  /**
   * Get all students
   */
  getAllStudents(): Observable<UserStudent[]> {
    return this.http.get<UserStudent[]>(`${this.apiUrl}/students`);
  }

  /**
   * Get user by ID
   */
  getUserById(userId: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Get user by username (admin only)
   */
  getUserByUsername(username: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/username/${username}`);
  }

  /**
   * Update user
   */
  updateUser(userId: string, userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Update user with professor info
   */
  updateProfessor(
    userId: string,
    userData: Partial<UserProfessor>,
  ): Observable<UserProfessor> {
    return this.http.patch<UserProfessor>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Update user with student info
   */
  updateStudent(
    userId: string,
    userData: Partial<UserStudent>,
  ): Observable<UserStudent> {
    return this.http.patch<UserStudent>(`${this.apiUrl}/${userId}`, userData);
  }

  /**
   * Delete user (admin only)
   */
  deleteUser(userId: string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${userId}`);
  }

  /**
   * Search users by name or email
   */
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/search`, {
      params: { query },
    });
  }

  /**
   * Get professors by department
   */
  getProfessorsByDepartment(departmentId: string): Observable<UserProfessor[]> {
    return this.http.get<UserProfessor[]>(
      `${this.apiUrl}/professors/department/${departmentId}`,
    );
  }

  /**
   * Get current user profile
   */
  getCurrentUser(): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/me`);
  }

  /**
   * Get users by role
   * @param role The role to filter users by (e.g., 'profesor', 'estudiante', 'admin')
   */
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}`, {
      params: { role },
    });
  }

  /**
   * Update user profile
   */
  updateProfile(userData: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/me`, userData);
  }

  /**
   * Get professor details
   */
  getProfessorDetails(professorId: string): Observable<Professor> {
    return this.http.get<Professor>(`${this.professorsUrl}/${professorId}`);
  }

  /**
   * Get student details
   */
  getStudentDetails(studentId: string): Observable<Student> {
    return this.http.get<Student>(
      `${environment.apiUrl}/students/${studentId}`,
    );
  }
}
