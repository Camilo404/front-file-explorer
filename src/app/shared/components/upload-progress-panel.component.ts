import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { UploadTrackerService } from '../../core/uploads/upload-tracker.service';

@Component({
  selector: 'app-upload-progress-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @keyframes panelSlideUp {
      from {
        transform: translateY(20px);
        opacity: 0;
      }
      to {
        transform: translateY(0);
        opacity: 1;
      }
    }
    :host {
      display: block;
    }
    .panel-enter {
      animation: panelSlideUp 0.25s ease-out forwards;
    }
  `,
  template: `
    @if (tracker.hasEntries()) {
      <div
        class="panel-enter fixed bottom-4 right-4 z-50 w-80 rounded-xl border border-white/10 bg-zinc-900/95 shadow-2xl backdrop-blur-xl"
        role="status"
        aria-live="polite"
      >
        <!-- Header -->
        <button
          type="button"
          class="flex w-full items-center justify-between gap-2 px-4 py-3 text-left"
          (click)="collapsed.set(!collapsed())"
          [attr.aria-expanded]="!collapsed()"
          aria-controls="upload-entries"
        >
          <div class="flex items-center gap-2.5 min-w-0">
            @if (tracker.isUploading()) {
              <i class="fa-solid fa-cloud-arrow-up text-violet-400 animate-pulse"></i>
            } @else {
              <i class="fa-solid fa-circle-check text-emerald-400"></i>
            }
            <span class="text-sm font-medium text-white truncate">
              {{ headerText() }}
            </span>
          </div>
          <div class="flex items-center gap-2 shrink-0">
            @if (tracker.isUploading()) {
              <span class="text-xs tabular-nums text-zinc-400">{{ tracker.overallProgress() }}%</span>
            }
            <i
              class="fa-solid text-xs text-zinc-500 transition-transform"
              [class.fa-chevron-down]="collapsed()"
              [class.fa-chevron-up]="!collapsed()"
            ></i>
          </div>
        </button>

        <!-- Overall progress bar (always visible) -->
        @if (tracker.isUploading()) {
          <div class="mx-4 mb-2 h-1 overflow-hidden rounded-full bg-zinc-800">
            <div
              class="h-full rounded-full bg-linear-to-r from-violet-500 to-fuchsia-500 transition-all duration-300 ease-out"
              [style.width.%]="tracker.overallProgress()"
            ></div>
          </div>
        }

        <!-- Entries list -->
        @if (!collapsed()) {
          <div
            id="upload-entries"
            class="max-h-64 overflow-y-auto border-t border-white/5 px-2 py-2 scrollbar-thin"
          >
            @for (entry of tracker.entries(); track entry.id) {
              <div class="flex items-center gap-2.5 rounded-lg px-2 py-1.5 hover:bg-white/5 transition-colors">
                <!-- Status icon -->
                <div class="shrink-0 flex items-center justify-center w-5">
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
                <div class="flex-1 min-w-0">
                  <div class="flex items-baseline justify-between gap-2">
                    <span
                      class="text-xs truncate"
                      [class.text-zinc-300]="entry.status !== 'error'"
                      [class.text-red-300]="entry.status === 'error'"
                      [title]="entry.fileName"
                    >
                      {{ entry.fileName }}
                    </span>
                    <span class="text-[10px] tabular-nums text-zinc-500 shrink-0">
                      {{ formatSize(entry.fileSize) }}
                    </span>
                  </div>

                  @if (entry.status === 'uploading' || entry.status === 'pending') {
                    <div class="mt-1 h-0.5 overflow-hidden rounded-full bg-zinc-800">
                      <div
                        class="h-full rounded-full bg-violet-500 transition-all duration-300 ease-out"
                        [style.width.%]="entry.progress"
                      ></div>
                    </div>
                  }

                  @if (entry.status === 'error' && entry.errorReason) {
                    <p class="mt-0.5 text-[10px] text-red-400 truncate" [title]="entry.errorReason">
                      {{ entry.errorReason }}
                    </p>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Footer actions -->
          @if (!tracker.isUploading()) {
            <div class="border-t border-white/5 px-4 py-2 flex justify-end">
              <button
                type="button"
                class="rounded-lg px-3 py-1 text-xs text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
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
}
