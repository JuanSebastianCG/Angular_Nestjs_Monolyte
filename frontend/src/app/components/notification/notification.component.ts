import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService, Notification } from './notification.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 flex flex-col gap-2 w-72">
      <div
        *ngFor="let notification of notifications"
        class="p-4 rounded-md shadow-md transition-opacity duration-300 ease-in-out"
        [ngClass]="{
          'bg-green-100 text-green-800': notification.type === 'success',
          'bg-red-100 text-red-800': notification.type === 'error',
          'bg-blue-100 text-blue-800': notification.type === 'info',
          'bg-yellow-100 text-yellow-800': notification.type === 'warning',
        }"
      >
        <div class="flex justify-between items-start">
          <p>{{ notification.message }}</p>
          <button
            class="text-gray-500 hover:text-gray-700 ml-2"
            (click)="dismiss(notification.id)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  `,
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private subscription: Subscription = new Subscription();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.subscription = this.notificationService.notifications$.subscribe(
      (notifications) => {
        this.notifications = notifications;
      },
    );
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  dismiss(id: string): void {
    this.notificationService.dismissNotification(id);
  }
}
