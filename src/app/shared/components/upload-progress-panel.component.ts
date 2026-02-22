import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { UploadTrackerService } from '../../core/uploads/upload-tracker.service';

@Component({
  selector: 'app-upload-progress-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @keyframes panelSlideUp {
      from {
        transform: translateY(20px) scale(0.95);
        opacity: 0;
      }
      to {
        transform: translateY(0) scale(1);
        opacity: 1;
      }
    }
    :host {
      display: block;
    }
    .panel-enter {
      animation: panelSlideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    .scrollbar-thin::-webkit-scrollbar {
      width: 4px;
    }
    .scrollbar-thin::-webkit-scrollbar-track {
      background: transparent;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb {
      background-color: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
    }
    .scrollbar-thin::-webkit-scrollbar-thumb:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }
  `,
  template: `
    @if (tracker.hasEntries()) {
      <div
        class="panel-enter fixed bottom-6 right-6 z-50 w-96 overflow-hidden rounded-2xl border border-white/10 bg-zinc-900/90 shadow-2xl backdrop-blur-md ring-1 ring-black/50"
        role="status"
        aria-live="polite"
      >
        <!-- Header -->
        <button
          type="button"
          class="flex w-full items-center justify-between gap-3 border-b border-white/5 bg-white/5 px-5 py-3.5 text-left transition-colors hover:bg-white/10"
          (click)="collapsed.set(!collapsed())"
          [attr.aria-expanded]="!collapsed()"
          aria-controls="upload-entries"
        >
          <div class="flex items-center gap-3 min-w-0">
            @if (tracker.isUploading()) {
              <div class="relative flex items-center justify-center size-5">
                <i class="fa-solid fa-cloud-arrow-up text-violet-400 absolute animate-pulse"></i>
              </div>
            } @else {
              <div class="relative flex items-center justify-center size-5">
                 <i class="fa-solid fa-circle-check text-emerald-400 text-lg"></i>
              </div>
            }
            <div class="flex flex-col min-w-0">
              <span class="text-sm font-semibold text-white truncate leading-tight">
                {{ headerText() }}
              </span>
              @if (tracker.isUploading()) {
                <span class="text-[10px] text-zinc-400 font-medium">
                  {{ tracker.overallProgress() }}% completado
                </span>
              }
            </div>
          </div>
          
          <div class="flex items-center gap-3 shrink-0">
            <i
              class="fa-solid fa-chevron-down text-xs text-zinc-500 transition-transform duration-200"
              [class.rotate-180]="!collapsed()"
            ></i>
          </div>
        </button>

        <!-- Overall progress bar (always visible if uploading) -->
        @if (tracker.isUploading()) {
          <div class="h-1 w-full bg-zinc-800/50">
            <div
              class="h-full bg-linear-to-r from-violet-500 via-fuchsia-500 to-violet-500 bg-size-[200%_100%] animate-gradient-x transition-all duration-300 ease-out"
              [style.width.%]="tracker.overallProgress()"
            ></div>
          </div>
        }

        <!-- Entries list -->
        @if (!collapsed()) {
          <div
            id="upload-entries"
            class="max-h-80 overflow-y-auto px-1 py-2 scrollbar-thin"
          >
            @for (entry of tracker.entries(); track entry.id) {
              <div class="group relative flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-white/5">
                <!-- Status icon -->
                <div class="mt-0.5 shrink-0 flex items-center justify-center size-8 rounded-full bg-white/5 ring-1 ring-white/5">
                  @switch (entry.status) {
                    @case ('pending') {
                      <i class="fa-solid fa-clock text-xs text-zinc-500"></i>
                    }
                    @case ('uploading') {
                      <i class="fa-solid fa-spinner animate-spin text-xs text-violet-400"></i>
                    }
                    @case ('done') {
                      <i class="fa-solid fa-check text-xs text-emerald-400"></i>
                    }
                    @case ('error') {
                      <i class="fa-solid fa-xmark text-xs text-red-400"></i>
                    }
                  }
                </div>

                <!-- File info + progress -->
                <div class="flex-1 min-w-0 space-y-2">
                  <div class="flex items-start justify-between gap-4">
                    <div class="flex flex-col min-w-0">
                      <span
                        class="text-sm font-medium truncate leading-tight"
                        [class.text-zinc-200]="entry.status !== 'error'"
                        [class.text-red-300]="entry.status === 'error'"
                        [title]="entry.fileName"
                      >
                        {{ entry.fileName }}
                      </span>
                      <span class="text-[10px] text-zinc-500 font-medium tabular-nums">
                        {{ formatSize(entry.fileSize) }}
                      </span>
                    </div>
                  </div>

                  @if (entry.status === 'uploading' || entry.status === 'pending') {
                    <div class="space-y-1.5">
                      <div class="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/5">
                        <div
                          class="h-full rounded-full bg-violet-500 transition-all duration-300 ease-out"
                          [style.width.%]="entry.progress"
                        ></div>
                      </div>

                      @if (entry.status === 'uploading' && entry.speed) {
                        <div class="flex items-center justify-between text-[10px] font-medium text-zinc-500 tabular-nums">
                          <span class="text-zinc-400">{{ formatSpeed(entry.speed) }}</span>
                          <span>{{ formatTime(entry.remainingTime) }} restantes</span>
                        </div>
                      }
                    </div>
                  }

                  @if (entry.status === 'error' && entry.errorReason) {
                    <p class="text-[10px] font-medium text-red-400 bg-red-400/10 px-2 py-1 rounded-md truncate border border-red-400/20" [title]="entry.errorReason">
                      {{ entry.errorReason }}
                    </p>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer actions -->
          @if (!tracker.isUploading()) {
            <div class="border-t border-white/5 bg-white/5 p-3 flex justify-end">
              <button
                type="button"
                class="rounded-lg bg-white/5 px-4 py-1.5 text-xs font-medium text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white hover:ring-white/20 active:scale-95"
                (click)="tracker.clearAll()"
              >
                Cerrar
              </button>
            </div>
          }
        }
      </div>
    }
  `,
})
export class UploadProgressPanelComponent {
  protected readonly tracker = inject(UploadTrackerService);
  protected readonly collapsed = signal(false);

  protected readonly headerText = computed(() => {
    if (this.tracker.isUploading()) {
      const total = this.tracker.totalCount();
      const completed = this.tracker.completedCount();
      return `Subiendo ${total - completed} de ${total} archivo${total > 1 ? 's' : ''}…`;
    }

    const errors = this.tracker.entries().filter((e) => e.status === 'error').length;
    if (errors > 0) {
      return `${this.tracker.completedCount()} subido${this.tracker.completedCount() > 1 ? 's' : ''}, ${errors} fallido${errors > 1 ? 's' : ''}`;
    }

    const count = this.tracker.completedCount();
    return `${count} archivo${count > 1 ? 's' : ''} subido${count > 1 ? 's' : ''}`;
  });

  protected formatSize(bytes: number): string {
    if (bytes < 1024) {
      return `${bytes} B`;
    }
    if (bytes < 1048576) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    if (bytes < 1073741824) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    return `${(bytes / 1073741824).toFixed(1)} GB`;
  }

  protected formatSpeed(bytesPerSec?: number): string {
    if (!bytesPerSec || bytesPerSec === 0) return '';
    return `${this.formatSize(bytesPerSec)}/s`;
  }

  protected formatTime(seconds?: number): string {
    if (seconds === undefined || seconds === null || !isFinite(seconds) || seconds === 0) return '';
    if (seconds < 60) return `${Math.round(seconds)}s`;

    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.round(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m ${secs}s`;
  }
}
