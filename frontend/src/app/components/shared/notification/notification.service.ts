import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);

  constructor() {}

  // Get all active notifications
  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }

  // Show a success notification
  success(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      message,
      type: 'success',
      duration,
    });
  }

  // Show an error notification
  error(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      message,
      type: 'error',
      duration,
    });
  }

  // Show an info notification
  info(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      message,
      type: 'info',
      duration,
    });
  }

  // Show a warning notification
  warning(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      message,
      type: 'warning',
      duration,
    });
  }

  // Remove a notification by ID
  remove(id: string): void {
    const current = this.notifications.getValue();
    this.notifications.next(
      current.filter((notification) => notification.id !== id),
    );
  }

  // Add a notification to the list
  private addNotification(notification: Notification): void {
    const current = this.notifications.getValue();
    this.notifications.next([...current, notification]);

    // Auto-remove after duration (if provided)
    if (notification.duration) {
      setTimeout(() => {
        this.remove(notification.id);
      }, notification.duration);
    }
  }

  // Generate a unique ID for a notification
  private generateId(): string {
    return `notification-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
}
