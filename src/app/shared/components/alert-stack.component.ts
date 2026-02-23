import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ErrorStoreService } from '../../core/errors/error-store.service';

@Component({
  selector: 'app-alert-stack',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (errorStore.alerts().length > 0) {
      <section class="pointer-events-none fixed bottom-6 right-6 z-100 flex w-full max-w-sm flex-col gap-4 p-4 sm:p-0">
        @for (alert of errorStore.alerts(); track alert.id) {
          <article
            class="alert-enter pointer-events-auto relative overflow-hidden rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-violet-900/20"
            [class.border-red-500/30]="alert.level === 'error'"
            [class.bg-zinc-900/90]="alert.level === 'error'"
            [class.border-amber-500/30]="alert.level === 'warning'"
            [class.bg-zinc-900/90]="alert.level === 'warning'"
            [class.border-violet-500/30]="alert.level === 'info'"
            [class.bg-zinc-900/90]="alert.level === 'info'"
            [class.border-emerald-500/30]="alert.level === 'success'"
            [class.bg-zinc-900/90]="alert.level === 'success'"
          >
            <!-- Background Glow Effect -->
            <div 
              class="absolute -left-4 -top-4 h-24 w-24 rounded-full opacity-20 blur-2xl transition-colors duration-500"
              [class.bg-red-500]="alert.level === 'error'"
              [class.bg-amber-500]="alert.level === 'warning'"
              [class.bg-violet-500]="alert.level === 'info'"
              [class.bg-emerald-500]="alert.level === 'success'"
            ></div>

            <div class="relative z-10 flex items-start gap-4">
              <!-- Icon -->
              <div 
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/5 border border-white/5 backdrop-blur-md shadow-inner transition-colors duration-300"
                [class.text-red-400]="alert.level === 'error'"
                [class.text-amber-400]="alert.level === 'warning'"
                [class.text-violet-400]="alert.level === 'info'"
                [class.text-emerald-400]="alert.level === 'success'"
              >
                @if (alert.level === 'error') {
                  <i class="fa-solid fa-circle-xmark text-xl"></i>
                } @else if (alert.level === 'warning') {
                  <i class="fa-solid fa-triangle-exclamation text-lg"></i>
                } @else if (alert.level === 'info') {
                  <i class="fa-solid fa-circle-info text-xl"></i>
                } @else if (alert.level === 'success') {
                  <i class="fa-solid fa-circle-check text-xl"></i>
                }
              </div>

              <!-- Content -->
              <div class="flex-1 min-w-0 pt-0.5">
                <h3 class="font-semibold text-zinc-100">{{ alert.title }}</h3>
                <p class="mt-0.5 text-sm text-zinc-400 leading-relaxed wrap-break-word">{{ alert.message }}</p>
                
                @if (alert.details) {
                  <div class="mt-3 overflow-hidden rounded-lg border border-white/5 bg-black/20">
                    <div class="max-h-24 overflow-y-auto custom-scrollbar p-2.5">
                      <p class="font-mono text-xs text-zinc-500 break-all whitespace-pre-wrap">{{ alert.details }}</p>
                    </div>
                  </div>
                }
              </div>

              <!-- Close Button -->
              <button
                type="button"
                class="shrink-0 -mr-1 -mt-1 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-white/10 hover:text-zinc-200 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white/10"
                (click)="errorStore.dismiss(alert.id)"
                aria-label="Close notification"
              >
                <i class="fa-solid fa-xmark text-sm"></i>
              </button>
            </div>
            
            <!-- Progress Bar -->
            <div class="absolute bottom-0 left-0 h-0.5 w-full bg-white/5 overflow-hidden rounded-b-2xl">
              <div 
                class="h-full origin-left animate-[shrink_6s_linear_forwards]"
                [class.bg-red-500]="alert.level === 'error'"
                [class.bg-amber-500]="alert.level === 'warning'"
                [class.bg-violet-500]="alert.level === 'info'"
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
      animation: alertSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes alertSlideIn {
      0% {
        opacity: 0;
        transform: translateY(1rem) scale(0.95);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }
    @keyframes shrink {
      from { transform: scaleX(1); }
      to { transform: scaleX(0); }
    }
  `]
})
export class AlertStackComponent {
  protected readonly errorStore = inject(ErrorStoreService);
}

