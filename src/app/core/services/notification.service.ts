import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Notification {
  id: string;
  type: 'info' | 'success' | 'warning' | 'error';
  title: string;
  message: string;
  duration?: number;
  persistent?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private notificationCount = 0;

  constructor() {}

  show(notification: Omit<Notification, 'id'>): string {
    const id = `notification-${++this.notificationCount}`;
    const newNotification: Notification = {
      ...notification,
      id,
      duration: notification.duration ?? 5000
    };

    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([...currentNotifications, newNotification]);

    // Auto-remove notification after duration (if not persistent)
    if (!newNotification.persistent && newNotification.duration) {
      setTimeout(() => {
        this.remove(id);
      }, newNotification.duration);
    }

    return id;
  }

  remove(id: string): void {
    const currentNotifications = this.notificationsSubject.value;
    const filtered = currentNotifications.filter(n => n.id !== id);
    this.notificationsSubject.next(filtered);
  }

  clear(): void {
    this.notificationsSubject.next([]);
  }

  // Métodos de conveniencia
  info(title: string, message: string, duration?: number): string {
    return this.show({ type: 'info', title, message, duration });
  }

  success(title: string, message: string, duration?: number): string {
    return this.show({ type: 'success', title, message, duration });
  }

  warning(title: string, message: string, duration?: number): string {
    return this.show({ type: 'warning', title, message, duration });
  }

  error(title: string, message: string, duration?: number): string {
    return this.show({ type: 'error', title, message, duration });
  }

  // Notificación específica para cuando se despierta el backend
  backendWaking(): string {
    return this.show({
      type: 'info',
      title: 'Conectando al servidor',
      message: 'El backend está despertando, esto puede tomar unos segundos...',
      duration: 10000
    });
  }

  backendOnline(): string {
    return this.show({
      type: 'success',
      title: 'Conexión establecida',
      message: 'Backend conectado exitosamente',
      duration: 3000
    });
  }

  backendOffline(): string {
    return this.show({
      type: 'warning',
      title: 'Modo offline',
      message: 'Usando datos locales. Algunas funciones pueden estar limitadas.',
      duration: 8000
    });
  }
}
