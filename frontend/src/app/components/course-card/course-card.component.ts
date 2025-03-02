import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Schedule {
  days: string[];
  startTime: string;
  endTime: string;
  room: string;
  startDate: string;
  endDate: string;
}

interface Course {
  _id: string;
  name: string;
  description: string;
  professorId?: string;
  professor?: string;
  schedule?: Schedule;
  department?: string;
  enrolledStudents?: number;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div
      class="bg-white p-4 rounded-md shadow-sm border border-gray-200 relative"
    >
      <!-- Course Title -->
      <h3 class="text-lg font-medium text-gray-800">{{ course.name }}</h3>

      <!-- Course Description -->
      <p class="text-gray-600 mt-2">{{ course.description }}</p>

      <!-- Conditional Info based on role -->
      <div class="mt-3">
        <!-- Show professor if available (for student or admin view) -->
        <p *ngIf="course.professor" class="text-sm text-gray-500">
          Profesor: {{ course.professor }}
        </p>

        <!-- Show department if available (for admin view) -->
        <p *ngIf="course.department" class="text-sm text-gray-500">
          Departamento: {{ course.department }}
        </p>

        <!-- Show enrolled students if available (for professor view) -->
        <p
          *ngIf="course.enrolledStudents !== undefined"
          class="text-sm text-gray-500"
        >
          Estudiantes inscritos: {{ course.enrolledStudents }}
        </p>

        <!-- Show schedule if available -->
        <div *ngIf="course.schedule" class="mt-2 text-sm text-gray-500">
          <p *ngIf="course.schedule.days?.length">
            Días: {{ course.schedule.days.join(', ') }}
          </p>
          <p *ngIf="course.schedule.startTime">
            Horario: {{ course.schedule.startTime }} -
            {{ course.schedule.endTime }}
          </p>
          <p *ngIf="course.schedule.room">Aula: {{ course.schedule.room }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div class="mt-4 flex justify-end space-x-2">
        <!-- Student: view details only -->
        <button
          *ngIf="userRole === 'student'"
          (click)="onViewDetails()"
          class="text-blue-600 hover:text-blue-800 text-sm"
        >
          Ver detalles
        </button>

        <!-- Professor: view details and students -->
        <button
          *ngIf="userRole === 'professor'"
          (click)="onViewDetails()"
          class="text-blue-600 hover:text-blue-800 text-sm"
        >
          Ver detalles
        </button>

        <!-- Admin: delete and edit buttons -->
        <div *ngIf="userRole === 'admin'" class="flex space-x-2">
          <button (click)="onEdit()" class="text-blue-500 hover:text-blue-700">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              ></path>
            </svg>
          </button>

          <button (click)="onDelete()" class="text-red-500 hover:text-red-700">
            <svg
              class="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2"
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              ></path>
            </svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [],
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() userRole: 'student' | 'professor' | 'admin' = 'student';

  @Output() viewDetails = new EventEmitter<string>();
  @Output() edit = new EventEmitter<string>();
  @Output() delete = new EventEmitter<string>();

  onViewDetails(): void {
    this.viewDetails.emit(this.course._id);
  }

  onEdit(): void {
    this.edit.emit(this.course._id);
  }

  onDelete(): void {
    this.delete.emit(this.course._id);
  }
}
