import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { NotificationService, Notification } from '../../../core/services/notification.service';

@Component({
  selector: 'app-notification',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-4 right-4 z-50 space-y-2">
      <div
        *ngFor="let notification of notifications"
        [ngClass]="getNotificationClasses(notification)"
        class="px-6 py-4 rounded-lg shadow-lg transform transition-all duration-300 ease-in-out max-w-sm"
      >
        <div class="flex items-center">
          <!-- Icono -->
          <div class="flex-shrink-0 mr-3">
            <ng-container [ngSwitch]="notification.type">
              <!-- Success -->
              <svg *ngSwitchCase="'success'" class="w-5 h-5 text-green-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
              </svg>

              <!-- Error -->
              <svg *ngSwitchCase="'error'" class="w-5 h-5 text-red-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
              </svg>

              <!-- Warning -->
              <svg *ngSwitchCase="'warning'" class="w-5 h-5 text-yellow-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>

              <!-- Info -->
              <svg *ngSwitchCase="'info'" class="w-5 h-5 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>

              <!-- Loading -->
              <svg *ngSwitchDefault class="w-5 h-5 text-blue-300 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </ng-container>
          </div>

          <!-- Contenido -->
          <div class="flex-1">
            <p class="text-sm font-medium" [innerHTML]="notification.message"></p>
          </div>

          <!-- Botón cerrar (solo si no es persistente y auto-dismiss) -->
          <div *ngIf="!notification.persistent" class="ml-4 flex-shrink-0">
            <button
              type="button"
              (click)="removeNotification(notification.id)"
              class="inline-flex text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span class="sr-only">Cerrar</span>
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .notification-enter {
      opacity: 0;
      transform: translateX(100%);
    }

    .notification-enter-active {
      opacity: 1;
      transform: translateX(0);
      transition: all 300ms ease-in-out;
    }

    .notification-leave {
      opacity: 1;
      transform: translateX(0);
    }

    .notification-leave-active {
      opacity: 0;
      transform: translateX(100%);
      transition: all 300ms ease-in-out;
    }
  `]
})
export class NotificationComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  private destroy$ = new Subject<void>();

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.notificationService.notifications$
      .pipe(takeUntil(this.destroy$))
      .subscribe(notifications => {
        this.notifications = notifications;
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  getNotificationClasses(notification: Notification): string {
    const baseClasses = 'border-l-4';

    switch (notification.type) {
      case 'success':
        return `${baseClasses} bg-green-50 border-green-400 text-green-700`;
      case 'error':
        return `${baseClasses} bg-red-50 border-red-400 text-red-700`;
      case 'warning':
        return `${baseClasses} bg-yellow-50 border-yellow-400 text-yellow-700`;
      case 'info':
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-700`;
      default:
        return `${baseClasses} bg-blue-50 border-blue-400 text-blue-700`;
    }
  }

  removeNotification(id: string): void {
    this.notificationService.remove(id);
  }
}
