import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { User } from '../../models/user.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [CommonModule],
})
export class NavbarComponent implements OnInit {
  user: User | null = null;
  isAuthenticated = false;
  isMobileMenuOpen = false;
  isProfileDropdownOpen = false;
  isScrolled = false;
  activeLink: string = '/';
  loggingOut = false;

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

  /**
   * Log out user
   * Makes a POST request to /auth/logout
   * Ensures local state is cleared even if API call fails with 400 error
   */
  logout() {
    // Prevent multiple logout attempts
    if (this.loggingOut) return;

    this.loggingOut = true;

    this.authService.logout().subscribe({
      next: (response) => {
        // Always navigate to login page and reset state
        this.loggingOut = false;
        this.isProfileDropdownOpen = false;
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Logout error', error);

        // Even if the API call fails with any error (400, 401, etc.)
        // we should still clear local state and redirect to login page
        this.loggingOut = false;
        this.isProfileDropdownOpen = false;

        // Try to clear auth data again to be extra safe
        try {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('userData');
        } catch (e) {
          console.error('Error clearing local storage', e);
        }

        this.router.navigate(['/login']);
      },
    });
  }

  /**
   * Get navigation links based on user role
   */
  get navLinks(): { label: string; path: string; icon: string }[] {
    const commonLinks = [
      {
        label: 'Home',
        path: '/',
        icon: 'fa-home',
      },
      {
        label: 'Courses',
        path: '/courses',
        icon: 'fa-book',
      },
    ];

    // Only show these links when authenticated
    if (!this.isAuthenticated) {
      return commonLinks;
    }

    const user = this.authService.getCurrentUser();
    if (!user) return commonLinks;

    // Admin links
    if (this.authService.isAdmin()) {
      return [
        ...commonLinks,
        {
          label: 'Departments',
          path: '/departments',
          icon: 'fa-building',
        },
        {
          label: 'Users',
          path: '/users',
          icon: 'fa-users',
        },
        {
          label: 'Reports',
          path: '/reports',
          icon: 'fa-chart-bar',
        },
      ];
    }

    // Professor links
    if (this.authService.isProfessor()) {
      return [
        ...commonLinks,
        {
          label: 'My Courses',
          path: '/professor/courses',
          icon: 'fa-chalkboard-teacher',
        },
        {
          label: 'Evaluations',
          path: '/evaluations',
          icon: 'fa-tasks',
        },
      ];
    }

    // Student links
    if (this.authService.isStudent()) {
      return [
        ...commonLinks,
        {
          label: 'My Enrollments',
          path: '/enrollment',
          icon: 'fa-user-graduate',
        },
        {
          label: 'My Grades',
          path: '/grades',
          icon: 'fa-graduation-cap',
        },
      ];
    }

    // Default links if role not recognized
    return commonLinks;
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
