import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class HomeComponent implements OnInit {
  user: User | null = null;
  isAuthenticated = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    // Check if user is authenticated
    this.isAuthenticated = this.authService.isAuthenticated();

    // Get current user if authenticated
    if (this.isAuthenticated) {
      this.user = this.authService.getCurrentUser();
    }

    // Listen for authentication changes
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
    });
  }

  // Get role-specific greeting
  get greeting(): string {
    if (!this.isAuthenticated) return 'Welcome to University App';

    const time = new Date().getHours();
    let greeting = '';

    if (time < 12) {
      greeting = 'Good Morning';
    } else if (time < 18) {
      greeting = 'Good Afternoon';
    } else {
      greeting = 'Good Evening';
    }

    const userName = this.authService.getUserDisplayName();
    return `${greeting}, ${userName}`;
  }

  // Get role-specific dashboard route
  get dashboardRoute(): string {
    if (!this.user) return '/login';

    switch (this.user.role) {
      case 'student':
        return '/student/dashboard';
      case 'professor':
        return '/professor/courses';
      case 'admin':
        return '/admin/dashboard';
      default:
        return '/courses';
    }
  }
}
