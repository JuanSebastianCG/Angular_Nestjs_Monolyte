import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  message: string;
  duration?: number;
}

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> =
    this.notificationsSubject.asObservable();

  constructor() {}

  // Show a success notification
  success(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'success',
      message,
      duration,
    });
  }

  // Show an error notification
  error(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'error',
      message,
      duration,
    });
  }

  // Show an info notification
  info(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'info',
      message,
      duration,
    });
  }

  // Show a warning notification
  warning(message: string, duration: number = 5000): void {
    this.addNotification({
      id: this.generateId(),
      type: 'warning',
      message,
      duration,
    });
  }

  // Remove a notification by ID
  removeNotification(id: string): void {
    const currentNotifications = this.notificationsSubject.getValue();
    const updatedNotifications = currentNotifications.filter(
      (notif) => notif.id !== id,
    );
    this.notificationsSubject.next(updatedNotifications);
  }

  // Clear all notifications
  clearAll(): void {
    this.notificationsSubject.next([]);
  }

  // Private method to add a notification
  private addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.getValue();
    this.notificationsSubject.next([...currentNotifications, notification]);

    // Auto-remove notification after duration
    if (notification.duration) {
      setTimeout(() => {
        this.removeNotification(notification.id);
      }, notification.duration);
    }
  }

  // Generate a unique ID for notifications
  private generateId(): string {
    return 'notification-' + Math.random().toString(36).substring(2, 11);
  }
}
