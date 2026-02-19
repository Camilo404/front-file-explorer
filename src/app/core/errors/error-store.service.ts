import { Injectable, signal } from '@angular/core';

import { AppAlert, AppAlertLevel } from './error.models';

@Injectable({ providedIn: 'root' })
export class ErrorStoreService {
  readonly alerts = signal<AppAlert[]>([]);

  error(title: string, message: string, details?: string): void {
    this.pushAlert('error', title, message, details);
  }

  warning(title: string, message: string, details?: string): void {
    this.pushAlert('warning', title, message, details);
  }

  info(title: string, message: string, details?: string): void {
    this.pushAlert('info', title, message, details);
  }

  success(title: string, message: string, details?: string): void {
    this.pushAlert('success', title, message, details);
  }

  pushAlert(level: AppAlertLevel, title: string, message: string, details?: string): void {
    const alert: AppAlert = {
      id: crypto.randomUUID(),
      level,
      title,
      message,
      details,
    };

    this.alerts.update((current) => [alert, ...current].slice(0, 5));

    setTimeout(() => {
      this.dismiss(alert.id);
    }, 6000);
  }

  dismiss(alertId: string): void {
    this.alerts.update((current) => current.filter((alert) => alert.id !== alertId));
  }
}
