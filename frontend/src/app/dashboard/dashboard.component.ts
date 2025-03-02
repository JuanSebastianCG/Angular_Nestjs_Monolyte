import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen flex flex-col">
      <header class="p-4">
        <div class="container mx-auto flex justify-between items-center">
          <a
            routerLink="/"
            class="text-blue-600 hover:text-blue-800 font-medium border-b-2 border-blue-600 px-2 py-1"
            >Home</a
          >
          <button (click)="logout()" class="text-red-600 hover:text-red-800">
            Logout
          </button>
        </div>
      </header>
      <main class="container mx-auto flex-grow p-4">
        <h1 class="text-3xl font-bold text-blue-600 mb-6">Dashboard</h1>
        <p class="mb-6">Welcome to the University Management System</p>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="bg-white p-4 rounded shadow-md border border-gray-100">
            <h2 class="text-lg font-semibold mb-2 text-blue-600">Courses</h2>
            <p>Manage your courses</p>
          </div>
          <div class="bg-white p-4 rounded shadow-md border border-gray-100">
            <h2 class="text-lg font-semibold mb-2 text-blue-600">
              Enrollments
            </h2>
            <p>Manage student enrollments</p>
          </div>
          <div class="bg-white p-4 rounded shadow-md border border-gray-100">
            <h2 class="text-lg font-semibold mb-2 text-blue-600">
              Evaluations
            </h2>
            <p>Manage course evaluations</p>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [],
})
export class DashboardComponent {
  constructor(private authService: AuthService) {}

  logout() {
    this.authService.logout();
  }
}
