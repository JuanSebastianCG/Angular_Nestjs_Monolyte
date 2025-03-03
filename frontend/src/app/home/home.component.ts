import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="min-h-screen bg-gray-50 flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b border-gray-200">
        <div
          class="container mx-auto px-4 py-4 flex justify-between items-center"
        >
          <h1 class="text-2xl font-bold text-blue-600">Universidad App</h1>
          <div class="flex space-x-4">
            <a
              routerLink="/login"
              class="px-4 py-2 rounded-md text-blue-600 hover:bg-blue-50"
              >Iniciar Sesión</a
            >
            <a
              routerLink="/register"
              class="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >Registrarse</a
            >
          </div>
        </div>
      </header>

      <!-- Main Content -->
      <main class="flex-grow">
        <div class="container mx-auto px-4 py-12">
          <div class="text-center mb-12">
            <h2 class="text-3xl font-bold text-gray-800 mb-4">
              Bienvenido al Sistema de Gestión Universitaria
            </h2>
            <p class="text-xl text-gray-600 max-w-2xl mx-auto">
              Administra tus cursos, calificaciones y más en nuestra plataforma
              intuitiva.
            </p>
          </div>

          <div class="grid md:grid-cols-3 gap-8 mt-12">
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h3 class="text-xl font-semibold text-gray-800 mb-3">
                Para Estudiantes
              </h3>
              <p class="text-gray-600 mb-4">
                Accede a tus cursos, revisa tus calificaciones y mantente al día
                con tus estudios.
              </p>
              <a routerLink="/login" class="text-blue-600 hover:underline"
                >Inicia sesión como estudiante →</a
              >
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h3 class="text-xl font-semibold text-gray-800 mb-3">
                Para Profesores
              </h3>
              <p class="text-gray-600 mb-4">
                Administra tus cursos, califica a tus estudiantes y mantén el
                control de tu enseñanza.
              </p>
              <a routerLink="/login" class="text-blue-600 hover:underline"
                >Inicia sesión como profesor →</a
              >
            </div>
            <div class="bg-white p-6 rounded-lg shadow-md">
              <h3 class="text-xl font-semibold text-gray-800 mb-3">
                Para Administradores
              </h3>
              <p class="text-gray-600 mb-4">
                Gestiona departamentos, cursos y usuarios del sistema
                universitario.
              </p>
              <a routerLink="/login" class="text-blue-600 hover:underline"
                >Inicia sesión como administrador →</a
              >
            </div>
          </div>
        </div>
      </main>

      <!-- Footer -->
      <footer class="bg-gray-800 text-white py-6">
        <div class="container mx-auto px-4 text-center">
          <p>© 2024 Sistema de Gestión Universitaria</p>
        </div>
      </footer>
    </div>
  `,
  styles: [
    `
      .container {
        max-width: 1200px;
      }
    `,
  ],
})
export class HomeComponent implements OnInit {
  constructor(
    private authService: AuthService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Check if user is already logged in, redirect to appropriate page
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/cursos']);
    }
  }
}
