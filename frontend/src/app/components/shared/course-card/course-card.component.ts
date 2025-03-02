import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Course {
  id: string;
  title: string;
  description: string;
  prerequisites?: string[];
  room?: string;
  startTime?: string;
  endTime?: string;
  days?: string[];
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-course-card',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="border border-blue-200 rounded-md p-4 flex flex-col relative">
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

      <!-- Course Title and Description -->
      <h3 class="text-lg font-medium border-b border-gray-200 pb-2">
        {{ course.title }}
      </h3>
      <p class="text-gray-600 my-2">{{ course.description }}</p>

      <!-- Prerequisites - Only shown for professor/admin mode -->
      <div *ngIf="showDetails && course.prerequisites?.length" class="mt-2">
        <h4 class="text-xs text-gray-500">Requisitos</h4>
        <p class="text-sm">{{ course.prerequisites?.join(', ') }}</p>
      </div>

      <!-- Course Details - Only shown for professor/admin mode -->
      <div *ngIf="showDetails" class="grid grid-cols-2 gap-2 mt-4">
        <!-- Left Column -->
        <div>
          <h4 class="text-xs text-gray-500">Habitación</h4>
          <p class="text-sm">{{ course.room || 'N/A' }}</p>

          <h4 class="text-xs text-gray-500 mt-2">
            {{ course.days?.join(', ') || 'N/A' }}
          </h4>
          <p class="text-sm" *ngIf="course.startTime && course.endTime">
            {{ course.startTime }} a {{ course.endTime }}
          </p>
        </div>

        <!-- Right Column -->
        <div>
          <h4 class="text-xs text-gray-500">Fecha Inicio</h4>
          <p class="text-sm">{{ course.startDate || '00/00/00' }}</p>

          <h4 class="text-xs text-gray-500 mt-2">Fecha Final</h4>
          <p class="text-sm">{{ course.endDate || '00/00/00' }}</p>
        </div>
      </div>

      <!-- Action Buttons - Placeholder for future functionality -->
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
