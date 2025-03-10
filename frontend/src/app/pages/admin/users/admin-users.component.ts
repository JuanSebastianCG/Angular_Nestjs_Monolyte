import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { UserService } from '../../../services/user.service';
import { User } from '../../../models/user.model';

@Component({
  selector: 'app-admin-users',
  templateUrl: './admin-users.component.html',
  styleUrls: ['./admin-users.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
})
export class AdminUsersComponent implements OnInit {
  // User data
  users: User[] = [];
  filteredUsers: User[] = [];

  // Loading and UI state
  isLoading: boolean = false;
  searchQuery: string = '';
  showDeleteConfirmModal: boolean = false;
  userToDelete: User | null = null;
  deleteError: string = '';
  deleteSuccess: string = '';

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /**
   * Load all users from the API
   */
  loadUsers(): void {
    this.isLoading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...users];
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
      },
    });
  }

  /**
   * Filter users based on search query
   */
  applySearchFilter(): void {
    if (!this.searchQuery.trim()) {
      this.filteredUsers = [...this.users];
      return;
    }

    const query = this.searchQuery.toLowerCase().trim();
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name?.toLowerCase().includes(query) ||
        user.username.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query),
    );
  }

  /**
   * Show delete confirmation for a user
   */
  confirmDeleteUser(user: User): void {
    this.userToDelete = user;
    this.showDeleteConfirmModal = true;
    this.deleteError = '';
    this.deleteSuccess = '';
  }

  /**
   * Cancel user deletion
   */
  cancelDelete(): void {
    this.showDeleteConfirmModal = false;
    this.userToDelete = null;
  }

  /**
   * Delete user after confirmation
   */
  deleteUser(): void {
    if (!this.userToDelete) return;

    const userId = this.userToDelete._id;

    this.userService.deleteUser(userId).subscribe({
      next: () => {
        // Remove user from lists
        this.users = this.users.filter((user) => user._id !== userId);
        this.filteredUsers = this.filteredUsers.filter(
          (user) => user._id !== userId,
        );

        this.deleteSuccess = `User ${this.userToDelete?.username} has been deleted successfully.`;
        this.showDeleteConfirmModal = false;
        this.userToDelete = null;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.deleteSuccess = '';
        }, 3000);
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.deleteError = 'Failed to delete user. Please try again.';
      },
    });
  }

  /**
   * Get CSS class for role badge
   */
  getRoleBadgeClass(role: string): string {
    switch (role.toLowerCase()) {
      case 'admin':
        return 'bg-danger';
      case 'professor':
        return 'bg-primary';
      case 'student':
        return 'bg-success';
      default:
        return 'bg-secondary';
    }
  }
}
