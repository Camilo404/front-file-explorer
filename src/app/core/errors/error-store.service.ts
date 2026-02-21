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
      id: this.createAlertId(),
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

  private createAlertId(): string {
    const cryptoApi = globalThis.crypto;

    if (cryptoApi && typeof cryptoApi.randomUUID === 'function') {
      return cryptoApi.randomUUID();
    }

    if (cryptoApi && typeof cryptoApi.getRandomValues === 'function') {
      const randomBytes = new Uint8Array(16);
      cryptoApi.getRandomValues(randomBytes);
      return Array.from(randomBytes, (value) => value.toString(16).padStart(2, '0')).join('');
    }

    return `alert-${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }
}
