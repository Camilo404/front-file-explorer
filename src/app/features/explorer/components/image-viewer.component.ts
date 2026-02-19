import { ChangeDetectionStrategy, Component, computed, effect, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-image-viewer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeViewer()',
    '(document:keydown.arrowleft)': 'goPrev()',
    '(document:keydown.arrowright)': 'goNext()',
    '(document:mouseup)': 'endPan()',
  },
  styles: [
    `
      @keyframes viewer-in {
        from { opacity: 0; backdrop-filter: blur(0px); }
        to   { opacity: 1; backdrop-filter: blur(16px); }
      }
      .viewer-enter { animation: viewer-in 300ms cubic-bezier(0.2, 0, 0, 1) forwards; }
    `,
  ],
  template: `
    @if (open()) {
      <section
        class="viewer-enter fixed inset-0 z-50 flex flex-col bg-black/90"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Image viewer: ' + imageName()"
      >
        <!-- ── Top Bar ─────────────────────────────────────── -->
        <header class="absolute top-0 left-0 right-0 z-50 flex items-center justify-between p-4 sm:p-6 pointer-events-none">
          <!-- File info -->
          <div class="flex items-center gap-3 pointer-events-auto">
            <div class="flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-lg">
              <i class="fa-solid fa-image text-lg"></i>
            </div>
            <div class="flex flex-col">
              <span class="max-w-50 sm:max-w-md truncate text-sm font-medium text-white drop-shadow-md" [title]="imageName()">{{ imageName() }}</span>
              @if (showCounter()) {
                <span class="text-xs font-medium text-white/60 drop-shadow-md">
                  {{ imageIndex() + 1 }} of {{ totalImages() }}
                </span>
              }
            </div>
          </div>

          <!-- Close button -->
          <button type="button"
            class="pointer-events-auto flex size-10 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur-md border border-white/10 shadow-lg transition-all hover:bg-white/20 hover:scale-105 active:scale-95"
            aria-label="Close viewer" title="Close (Esc)" (click)="closeViewer()">
            <i class="fa-solid fa-xmark text-lg"></i>
          </button>
        </header>

        <!-- ── Main viewport ───────────────────────────────────── -->
        <div class="relative flex flex-1 items-center justify-center overflow-hidden">
          <!-- Backdrop click-to-close -->
          <button type="button" class="absolute inset-0 cursor-default focus:outline-none"
            aria-label="Close viewer" tabindex="-1" (click)="closeViewer()"></button>

          <!-- Prev arrow -->
          @if (canPrev()) {
            <button type="button"
              class="group absolute left-4 sm:left-8 z-40 flex size-12 sm:size-14 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md border border-white/10 shadow-2xl transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
              aria-label="Previous image (←)" title="Previous (←)" (click)="goPrev()">
              <i class="fa-solid fa-chevron-left text-2xl sm:text-3xl transition-transform group-hover:-translate-x-1"></i>
            </button>
          }

          <!-- Next arrow -->
          @if (canNext()) {
            <button type="button"
              class="group absolute right-4 sm:right-8 z-40 flex size-12 sm:size-14 items-center justify-center rounded-full bg-white/5 text-white backdrop-blur-md border border-white/10 shadow-2xl transition-all hover:bg-white/20 hover:scale-110 active:scale-95"
              aria-label="Next image (→)" title="Next (→)" (click)="goNext()">
              <i class="fa-solid fa-chevron-right text-2xl sm:text-3xl transition-transform group-hover:translate-x-1"></i>
            </button>
          }

          <!-- Image area -->
          <div class="relative z-10 h-full w-full overflow-hidden"
            [style.cursor]="isPanning() ? 'grabbing' : 'grab'"
            (wheel)="onWheel($event)"
            (mousedown)="startPan($event)"
            (mousemove)="onPan($event)"
            (mouseleave)="endPan()"
            (dblclick)="toggleFitZoom()">

            <!-- Loading spinner -->
            @if (isLoading()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none"
                aria-live="polite" aria-label="Loading image">
                <div class="relative flex size-16 items-center justify-center">
                  <div class="absolute inset-0 rounded-full border-4 border-white/10"></div>
                  <div class="absolute inset-0 rounded-full border-4 border-white border-t-transparent animate-spin"></div>
                </div>
              </div>
            }

            <!-- Error state -->
            @if (hasError()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-4 pointer-events-none">
                <div class="flex size-16 items-center justify-center rounded-full bg-red-500/20 text-red-400 backdrop-blur-md">
                  <i class="fa-solid fa-circle-exclamation text-3xl"></i>
                </div>
                <p class="text-sm font-medium text-white/80">Could not load image</p>
              </div>
            }

            <img
              [src]="imageUrl() ?? ''"
              [alt]="imageName()"
              class="absolute left-1/2 top-1/2 max-h-full max-w-full select-none shadow-2xl"
              draggable="false"
              [style.transform]="transformStyle()"
              [style.transform-origin]="'center center'"
              [style.transition]="isPanning() ? 'none' : 'opacity 300ms ease, transform 200ms cubic-bezier(0.2, 0, 0, 1)'"
              [style.opacity]="isLoading() || hasError() ? '0' : '1'"
              (load)="onImageLoad()"
              (error)="onImageError()"
            />
          </div>
        </div>

        <!-- ── Bottom Toolbar ───────────────────────────────── -->
        <footer class="absolute bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 rounded-full bg-white/10 p-1.5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <button type="button"
            class="flex size-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95"
            aria-label="Zoom out" title="Zoom out" (click)="zoomOut()">
            <i class="fa-solid fa-magnifying-glass-minus text-lg"></i>
          </button>

          <button type="button"
            class="min-w-18 rounded-full px-3 py-1.5 text-center font-mono text-sm font-medium text-white transition-all hover:bg-white/20 active:scale-95"
            aria-label="Reset zoom" title="Reset zoom" (click)="resetView()">
            {{ zoomLabel() }}
          </button>

          <button type="button"
            class="flex size-10 items-center justify-center rounded-full text-white/80 transition-all hover:bg-white/20 hover:text-white active:scale-95"
            aria-label="Zoom in" title="Zoom in" (click)="zoomIn()">
            <i class="fa-solid fa-magnifying-glass-plus text-lg"></i>
          </button>
        </footer>
      </section>
    }
  `,
})
export class ImageViewerComponent {
  readonly open = input(false);
  readonly imageUrl = input<string | null>(null);
  readonly imageName = input('Image');
  readonly canPrev = input(false);
  readonly canNext = input(false);
  /** 0-based index of the current image. Used for the "X / Y" counter. */
  readonly imageIndex = input(-1);
  /** Total number of images. Used together with imageIndex for the counter display. */
  readonly totalImages = input(0);

  readonly close = output<void>();
  readonly prev = output<void>();
  readonly next = output<void>();

  readonly zoom = signal(1);
  readonly offsetX = signal(0);
  readonly offsetY = signal(0);
  readonly isPanning = signal(false);
  readonly isLoading = signal(false);
  readonly hasError = signal(false);

  private panStartX = 0;
  private panStartY = 0;
  private panOriginX = 0;
  private panOriginY = 0;

  readonly zoomLabel = computed(() => `${Math.round(this.zoom() * 100)}%`);
  readonly transformStyle = computed(
    () =>
      `translate(calc(-50% + ${this.offsetX()}px), calc(-50% + ${this.offsetY()}px)) scale(${this.zoom()})`,
  );
  readonly showCounter = computed(() => this.imageIndex() >= 0 && this.totalImages() > 0);

  constructor() {
    // Reset + show loading state whenever the image URL changes.
    effect(() => {
      const url = this.imageUrl();
      if (url) {
        this.isLoading.set(true);
        this.hasError.set(false);
        this.resetView();
      }
    });
  }

  onImageLoad(): void {
    this.isLoading.set(false);
  }

  onImageError(): void {
    this.isLoading.set(false);
    this.hasError.set(true);
  }

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

  zoomIn(): void {
    this.setZoom(this.zoom() + 0.2);
  }

  zoomOut(): void {
    this.setZoom(this.zoom() - 0.2);
  }

  /** Double-click: toggle between fit (1×) and 2× zoom. */
  toggleFitZoom(): void {
    if (this.zoom() !== 1) {
      this.resetView();
    } else {
      this.offsetX.set(0);
      this.offsetY.set(0);
      this.zoom.set(2);
    }
  }

  resetView(): void {
    this.zoom.set(1);
    this.offsetX.set(0);
    this.offsetY.set(0);
    this.isPanning.set(false);
  }

  onWheel(event: WheelEvent): void {
    event.preventDefault();
    const delta = event.deltaY < 0 ? 0.12 : -0.12;
    this.setZoom(this.zoom() + delta);
  }

  startPan(event: MouseEvent): void {
    if (event.button !== 0) {
      return;
    }
    event.preventDefault();
    this.isPanning.set(true);
    this.panStartX = event.clientX;
    this.panStartY = event.clientY;
    this.panOriginX = this.offsetX();
    this.panOriginY = this.offsetY();
  }

  onPan(event: MouseEvent): void {
    if (!this.isPanning()) {
      return;
    }
    this.offsetX.set(this.panOriginX + (event.clientX - this.panStartX));
    this.offsetY.set(this.panOriginY + (event.clientY - this.panStartY));
  }

  endPan(): void {
    if (this.isPanning()) {
      this.isPanning.set(false);
    }
  }

  private setZoom(value: number): void {
    this.zoom.set(Math.max(0.1, Math.min(10, value)));
  }
}
