import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './notification.service';
import { Observable } from 'rxjs';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-notification',
  templateUrl: './notification.component.html',
  styleUrls: ['./notification.component.css'],
  standalone: true,
  imports: [CommonModule],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateY(-20px)', opacity: 0 }),
        animate(
          '300ms ease-out',
          style({ transform: 'translateY(0)', opacity: 1 }),
        ),
      ]),
      transition(':leave', [
        animate(
          '200ms ease-in',
          style({ transform: 'translateX(100%)', opacity: 0 }),
        ),
      ]),
    ]),
  ],
})
export class NotificationComponent implements OnInit {
  notifications$: Observable<Notification[]>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.getNotifications();
  }

  ngOnInit(): void {}

  closeNotification(id: string): void {
    this.notificationService.remove(id);
  }

  getIcon(type: string): string {
    switch (type) {
      case 'success':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        `;
      case 'error':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        `;
      case 'warning':
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        `;
      case 'info':
      default:
        return `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        `;
    }
  }

  getTypeClasses(type: string): { [key: string]: boolean } {
    const baseClasses = {
      'rounded-lg': true,
      'p-4': true,
      'mb-3': true,
      flex: true,
      'items-center': true,
      'shadow-md': true,
    };

    switch (type) {
      case 'success':
        return {
          ...baseClasses,
          'bg-green-100': true,
          'text-green-800': true,
          'border-l-4': true,
          'border-green-500': true,
        };
      case 'error':
        return {
          ...baseClasses,
          'bg-red-100': true,
          'text-red-800': true,
          'border-l-4': true,
          'border-red-500': true,
        };
      case 'warning':
        return {
          ...baseClasses,
          'bg-yellow-100': true,
          'text-yellow-800': true,
          'border-l-4': true,
          'border-yellow-500': true,
        };
      case 'info':
      default:
        return {
          ...baseClasses,
          'bg-blue-100': true,
          'text-blue-800': true,
          'border-l-4': true,
          'border-blue-500': true,
        };
    }
  }
}
