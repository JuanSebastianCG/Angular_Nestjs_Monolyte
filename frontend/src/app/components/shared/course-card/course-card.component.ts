import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Prerequisite {
  courseId: string;
  name: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  prerequisites?: Prerequisite[];
  room?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  startDate?: string;
  endDate?: string;
  isEnrolled?: boolean;
  enrollmentStatus?: string;
  enrollmentDate?: string;
  enrolledStudents?: number;
  department?: string;
  professor?: string;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-blue-200 rounded-md p-4 flex flex-col relative" 
         [ngClass]="{'border-green-300 bg-green-50': course.isEnrolled}">
      <!-- Delete Button (Only shown for admin) -->
      <button
        *ngIf="showDeleteButton"
        class="absolute top-2 right-2 text-red-500 hover:text-red-700"
        (click)="onDelete.emit(course.id)"
      >
        <svg
          class="w-5 h-5"
          fill="currentColor"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill-rule="evenodd"
            d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
            clip-rule="evenodd"
          ></path>
        </svg>
      </button>

      <!-- Enrollment Status Badge -->
      <div *ngIf="course.isEnrolled" class="absolute top-2 left-2">
        <span class="bg-green-600 text-white text-xs px-2 py-1 rounded-full">
          Inscrito
        </span>
      </div>

      <!-- Course Title and Description -->
      <h3 class="text-lg font-medium border-b border-gray-200 pb-2 mt-6">
        {{ course.title }}
      </h3>
      <p class="text-gray-600 my-2">{{ course.description }}</p>

      <!-- Department and Professor Info -->
      <div class="text-sm text-gray-600 mb-2">
        <p *ngIf="course.department">Departamento: {{ course.department }}</p>
        <p *ngIf="course.professor">Profesor: {{ course.professor }}</p>
      </div>

      <!-- Prerequisites - Always shown now -->
      <div *ngIf="course.prerequisites?.length" class="mt-2 border-t border-gray-100 pt-2">
        <h4 class="text-xs text-gray-500 font-medium">Requisitos Previos</h4>
        <ul class="text-sm list-disc list-inside">
          <li *ngFor="let prereq of course.prerequisites">{{ prereq.name }}</li>
        </ul>
      </div>

      <!-- Enrollment Details - Only shown if enrolled -->
      <div *ngIf="course.isEnrolled" class="mt-2 border-t border-gray-100 pt-2">
        <h4 class="text-xs text-gray-500 font-medium">Información de Inscripción</h4>
        <p class="text-sm">Estado: {{ course.enrollmentStatus || 'Activo' }}</p>
        <p class="text-sm" *ngIf="course.enrollmentDate">Fecha de inscripción: {{ course.enrollmentDate }}</p>
      </div>

      <!-- Enrolled Students Count - Only for Professor and Admin -->
      <div *ngIf="showDetails && course.enrolledStudents !== undefined" class="mt-2">
        <h4 class="text-xs text-gray-500 font-medium">Estudiantes Inscritos</h4>
        <p class="text-sm">{{ course.enrolledStudents }} estudiante(s)</p>
      </div>

      <!-- Course Details - Only shown for professor/admin mode -->
      <div *ngIf="showDetails" class="grid grid-cols-2 gap-2 mt-4 border-t border-gray-100 pt-2">
        <!-- Left Column -->
        <div>
          <h4 class="text-xs text-gray-500 font-medium">Habitación</h4>
          <p class="text-sm">{{ course.room || 'N/A' }}</p>

          <h4 class="text-xs text-gray-500 mt-2 font-medium">Días</h4>
          <p class="text-sm">{{ course.days?.join(', ') || 'N/A' }}</p>
          <p class="text-sm" *ngIf="course.startTime && course.endTime">
            {{ course.startTime }} a {{ course.endTime }}
          </p>
        </div>

        <!-- Right Column -->
        <div>
          <h4 class="text-xs text-gray-500 font-medium">Fecha Inicio</h4>
          <p class="text-sm">{{ course.startDate || 'N/A' }}</p>

          <h4 class="text-xs text-gray-500 mt-2 font-medium">Fecha Final</h4>
          <p class="text-sm">{{ course.endDate || 'N/A' }}</p>
        </div>
      </div>

      <!-- Action Buttons -->
      <div *ngIf="showActionButton" class="mt-4 text-right">
        <button
          (click)="onAction.emit(course.id)"
          class="bg-blue-600 text-white px-4 py-1 rounded text-sm hover:bg-blue-700"
        >
          {{ actionButtonText }}
        </button>
      </div>
    </div>
  `,
  styles: [],
})
export class CourseCardComponent {
  @Input() course!: Course;
  @Input() showDetails: boolean = false;
  @Input() showDeleteButton: boolean = false;
  @Input() showActionButton: boolean = false;
  @Input() actionButtonText: string = 'Ver';

  @Output() onDelete = new EventEmitter<string>();
  @Output() onAction = new EventEmitter<string>();
}
