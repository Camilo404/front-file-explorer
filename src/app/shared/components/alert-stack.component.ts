import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ErrorStoreService } from '../../core/errors/error-store.service';

@Component({
  selector: 'app-alert-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorStore.alerts().length > 0) {
      <section class="pointer-events-none fixed right-4 top-4 z-50 flex w-full max-w-md flex-col gap-2">
        @for (alert of errorStore.alerts(); track alert.id) {
          <article
            class="pointer-events-auto rounded p-3 text-sm shadow-lg"
            [class.border]="true"
            [class.border-red-700]="alert.level === 'error'"
            [class.bg-red-950]="alert.level === 'error'"
            [class.text-red-100]="alert.level === 'error'"
            [class.border-amber-700]="alert.level === 'warning'"
            [class.bg-amber-950]="alert.level === 'warning'"
            [class.text-amber-100]="alert.level === 'warning'"
            [class.border-sky-700]="alert.level === 'info'"
            [class.bg-sky-950]="alert.level === 'info'"
            [class.text-sky-100]="alert.level === 'info'"
            [class.border-emerald-700]="alert.level === 'success'"
            [class.bg-emerald-950]="alert.level === 'success'"
            [class.text-emerald-100]="alert.level === 'success'"
          >
            <div class="flex items-start justify-between gap-2">
              <div>
                <h3 class="font-semibold">{{ alert.title }}</h3>
                <p>{{ alert.message }}</p>
                @if (alert.details) {
                  <p class="mt-1 text-xs opacity-90">{{ alert.details }}</p>
                }
              </div>
              <button
                type="button"
                class="rounded bg-slate-900/60 px-2 py-1 text-xs hover:bg-slate-900"
                (click)="errorStore.dismiss(alert.id)"
                aria-label="Dismiss alert"
              >
                Cerrar
              </button>
            </div>
          </article>
        }
      </section>
    }
  `,
})
export class AlertStackComponent {
  protected readonly errorStore = inject(ErrorStoreService);
}
