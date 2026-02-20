import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';

@Component({
  selector: 'app-video-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeViewer()',
    '(document:keydown.arrowleft)': 'goPrev()',
    '(document:keydown.arrowright)': 'goNext()',
  },
  template: `
    @if (open()) {
      <section
        class="fixed inset-0 z-50 flex flex-col bg-black/90"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Video viewer: ' + videoName()"
      >
        <header class="absolute left-0 right-0 top-0 z-50 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
          <div class="pointer-events-auto flex items-center gap-3">
            <div class="flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md shadow-lg">
              <i class="fa-solid fa-video text-lg"></i>
            </div>
            <div class="flex flex-col">
              <span class="max-w-50 sm:max-w-md truncate text-sm font-medium text-white drop-shadow-md" [title]="videoName()">{{ videoName() }}</span>
              @if (showCounter()) {
                <span class="text-xs font-medium text-white/60 drop-shadow-md">
                  {{ videoIndex() + 1 }} of {{ totalVideos() }}
                </span>
              }
            </div>
          </div>

          <button
            type="button"
            class="pointer-events-auto flex size-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white backdrop-blur-md shadow-lg transition-all hover:scale-105 hover:bg-white/20 active:scale-95"
            aria-label="Close viewer"
            title="Close (Esc)"
            (click)="closeViewer()"
          >
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </header>

        <div class="relative flex flex-1 items-center justify-center overflow-hidden">
          <button
            type="button"
            class="absolute inset-0 cursor-default focus:outline-none"
            aria-label="Close viewer"
            tabindex="-1"
            (click)="closeViewer()"
          ></button>

          @if (canPrev()) {
            <button
              type="button"
              class="group absolute left-4 sm:left-8 z-40 flex size-12 sm:size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md shadow-2xl transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
              aria-label="Previous video (←)"
              title="Previous (←)"
              (click)="goPrev()"
            >
              <i class="fa-solid fa-chevron-left text-2xl sm:text-3xl transition-transform group-hover:-translate-x-1"></i>
            </button>
          }

          @if (canNext()) {
            <button
              type="button"
              class="group absolute right-4 sm:right-8 z-40 flex size-12 sm:size-14 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white backdrop-blur-md shadow-2xl transition-all hover:scale-110 hover:bg-white/20 active:scale-95"
              aria-label="Next video (→)"
              title="Next (→)"
              (click)="goNext()"
            >
              <i class="fa-solid fa-chevron-right text-2xl sm:text-3xl transition-transform group-hover:translate-x-1"></i>
            </button>
          }

          <div class="relative z-10 flex h-full w-full items-center justify-center px-4 py-20 sm:px-8 sm:py-24">
            <video
              [src]="videoUrl() ?? ''"
              [attr.aria-label]="videoName()"
              class="max-h-full max-w-full rounded-xl border border-white/10 bg-black shadow-2xl"
              controls
              autoplay
              playsinline
              preload="metadata"
            ></video>
          </div>
        </div>
      </section>
    }
  `,
})
export class VideoViewerComponent {
  readonly open = input(false);
  readonly videoUrl = input<string | null>(null);
  readonly videoName = input('Video');
  readonly canPrev = input(false);
  readonly canNext = input(false);
  readonly videoIndex = input(-1);
  readonly totalVideos = input(0);

  readonly close = output<void>();
  readonly prev = output<void>();
  readonly next = output<void>();

  readonly showCounter = computed(() => this.videoIndex() >= 0 && this.totalVideos() > 0);

  closeViewer(): void {
    if (!this.open()) {
      return;
    }

    this.close.emit();
  }

  goPrev(): void {
    if (!this.open() || !this.canPrev()) {
      return;
    }

    this.prev.emit();
  }

  goNext(): void {
    if (!this.open() || !this.canNext()) {
      return;
    }

    this.next.emit();
  }
}
