import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
})
export class NavbarComponent implements OnInit {
  user: User | null = null;
  isAuthenticated = false;
  isMobileMenuOpen = false;
  isProfileDropdownOpen = false;
  isScrolled = false;
  activeLink: string = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Check if user is authenticated on init
    this.isAuthenticated = this.authService.isAuthenticated();

    // Get current user if authenticated
    if (this.isAuthenticated) {
      this.user = this.authService.getCurrentUser();
    }

    // Subscribe to auth changes
    this.authService.currentUser$.subscribe((user) => {
      this.user = user;
      this.isAuthenticated = !!user;
    });

    // Set active link based on current route
    this.activeLink = this.router.url;
  }

  /**
   * Navigate to a specific route
   * @param path Path to navigate to
   */
  navigateTo(path: string) {
    this.isMobileMenuOpen = false;
    this.activeLink = path;
    this.router.navigate([path]);
  }

  /**
   * Navigate to login page
   */
  navigateToLogin() {
    this.navigateTo('/login');
  }

  /**
   * Navigate to register page
   */
  navigateToRegister() {
    this.navigateTo('/register');
  }

  /**
   * Navigate to profile page
   */
  navigateToProfile() {
    this.navigateTo('/profile');
  }

  /**
   * Navigate to student dashboard
   */
  navigateToStudentDashboard() {
    this.navigateTo('/student/dashboard');
  }

  /**
   * Navigate to professor courses
   */
  navigateToProfessorCourses() {
    this.navigateTo('/professor/courses');
  }

  /**
   * Navigate to admin dashboard
   */
  navigateToAdminDashboard() {
    this.navigateTo('/admin/dashboard');
  }

  /**
   * Check if a link is active
   * @param path Path to check
   */
  isLinkActive(path: string): boolean {
    return this.activeLink === path;
  }

  // Listen for scroll events to update navbar style
  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.isScrolled = window.scrollY > 20;
  }

  // Toggle mobile menu
  toggleMobileMenu() {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
    // Close profile dropdown when toggling mobile menu
    if (this.isMobileMenuOpen) {
      this.isProfileDropdownOpen = false;
    }
  }

  // Toggle profile dropdown
  toggleProfileDropdown(event: Event) {
    event.stopPropagation();
    this.isProfileDropdownOpen = !this.isProfileDropdownOpen;
  }

  // Close dropdowns when clicking outside
  @HostListener('document:click', [])
  closeDropdowns() {
    this.isProfileDropdownOpen = false;
  }

  // Log out user
  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error', error);
      },
    });
  }

  // Get role-specific navigation links
  get navLinks(): { label: string; path: string; icon: string }[] {
    const commonLinks = [
      { label: 'Home', path: '/', icon: 'fa-home' },
      { label: 'Courses', path: '/courses', icon: 'fa-book' },
      { label: 'Departments', path: '/departments', icon: 'fa-building' },
    ];

    if (!this.user) return commonLinks;

    switch (this.user.role) {
      case 'student':
        return [
          ...commonLinks,
          {
            label: 'My Enrollments',
            path: '/student/enrollments',
            icon: 'fa-graduation-cap',
          },
          {
            label: 'My Grades',
            path: '/student/grades',
            icon: 'fa-chart-line',
          },
        ];

      case 'professor':
        return [
          ...commonLinks,
          {
            label: 'My Courses',
            path: '/professor/courses',
            icon: 'fa-chalkboard-teacher',
          },
          {
            label: 'Evaluations',
            path: '/professor/evaluations',
            icon: 'fa-clipboard-check',
          },
        ];

      case 'admin':
        return [
          ...commonLinks,
          { label: 'Users', path: '/admin/users', icon: 'fa-users' },
          {
            label: 'Dashboard',
            path: '/admin/dashboard',
            icon: 'fa-tachometer-alt',
          },
        ];

      default:
        return commonLinks;
    }
  }

  // Get profile display name (or username as fallback)
  get displayName(): string {
    return this.authService.getUserDisplayName();
  }

  // Get first letter of name for avatar
  get avatarInitial(): string {
    const displayName = this.authService.getUserDisplayName();
    return displayName.charAt(0).toUpperCase();
  }

  // Get user role for display
  get userRole(): string {
    return this.user?.role
      ? this.user.role.charAt(0).toUpperCase() + this.user.role.slice(1)
      : '';
  }
}
