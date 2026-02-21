import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ErrorStoreService } from '../../core/errors/error-store.service';

@Component({
  selector: 'app-alert-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorStore.alerts().length > 0) {
      <section class="pointer-events-none fixed bottom-6 right-6 z-50 flex w-full max-w-sm flex-col gap-4">
        @for (alert of errorStore.alerts(); track alert.id) {
          <article
            class="alert-enter pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl"
            [class.border-red-500/30]="alert.level === 'error'"
            [class.bg-red-950/60]="alert.level === 'error'"
            [class.border-amber-500/30]="alert.level === 'warning'"
            [class.bg-amber-950/60]="alert.level === 'warning'"
            [class.border-fuchsia-500/30]="alert.level === 'info'"
            [class.bg-fuchsia-950/60]="alert.level === 'info'"
            [class.border-emerald-500/30]="alert.level === 'success'"
            [class.bg-emerald-950/60]="alert.level === 'success'"
          >
            <!-- Background Glow Effect for extra premium feel -->
            <div 
              class="absolute -left-10 -top-10 h-32 w-32 rounded-full opacity-25 blur-3xl"
              [class.bg-red-500]="alert.level === 'error'"
              [class.bg-amber-500]="alert.level === 'warning'"
              [class.bg-fuchsia-500]="alert.level === 'info'"
              [class.bg-emerald-500]="alert.level === 'success'"
            ></div>

            <div class="relative z-10 flex items-start gap-4">
              <!-- Animated Icon Container -->
              <div 
                class="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/5 border border-white/5 backdrop-blur-md shadow-inner"
                [class.text-red-400]="alert.level === 'error'"
                [class.text-amber-400]="alert.level === 'warning'"
                [class.text-fuchsia-400]="alert.level === 'info'"
                [class.text-emerald-400]="alert.level === 'success'"
              >
                @if (alert.level === 'error') {
                  <i class="fa-solid fa-circle-xmark text-2xl drop-shadow-md"></i>
                } @else if (alert.level === 'warning') {
                  <i class="fa-solid fa-triangle-exclamation text-xl drop-shadow-md"></i>
                } @else if (alert.level === 'info') {
                  <i class="fa-solid fa-circle-info text-2xl drop-shadow-md"></i>
                } @else if (alert.level === 'success') {
                  <i class="fa-solid fa-check-circle text-2xl drop-shadow-md"></i>
                }
              </div>

              <!-- Text Content -->
              <div class="flex-1 pt-1">
                <h3 class="font-semibold tracking-wide text-zinc-100 drop-shadow-sm">{{ alert.title }}</h3>
                <p class="mt-1 text-sm font-medium leading-relaxed text-zinc-300">{{ alert.message }}</p>
                @if (alert.details) {
                  <p class="mt-3 rounded-lg bg-black/30 px-3 py-2 font-mono text-xs text-zinc-400 shadow-inner">
                    {{ alert.details }}
                  </p>
                }
              </div>

              <!-- Close Button -->
              <button
                type="button"
                class="shrink-0 rounded-full p-2 text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                (click)="errorStore.dismiss(alert.id)"
                aria-label="Dismiss alert"
              >
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            
            <!-- Timing Bar Simulator (visual only, dismisses from service) -->
            <div class="absolute bottom-0 left-0 h-1 w-full bg-white/5">
              <div 
                class="h-full origin-left animate-[shrink_6s_linear_forwards]"
                [class.bg-red-500]="alert.level === 'error'"
                [class.bg-amber-500]="alert.level === 'warning'"
                [class.bg-fuchsia-500]="alert.level === 'info'"
                [class.bg-emerald-500]="alert.level === 'success'"
              ></div>
            </div>
          </article>
        }
      </section>
    }
  `,
  styles: [`
    .alert-enter {
      animation: alertSlideIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes alertSlideIn {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes shrink {
      0% {
        transform: scaleX(1);
      }
      100% {
        transform: scaleX(0);
      }
    }
  `]
})
export class AlertStackComponent {
  protected readonly errorStore = inject(ErrorStoreService);
}
