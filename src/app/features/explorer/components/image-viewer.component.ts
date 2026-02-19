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
        from { opacity: 0; transform: scale(0.97); }
        to   { opacity: 1; transform: scale(1); }
      }
      .viewer-enter { animation: viewer-in 180ms cubic-bezier(0.16, 1, 0.3, 1) forwards; }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }
      .spinner { animation: spin 0.75s linear infinite; }
    `,
  ],
  template: `
    @if (open()) {
      <section
        class="viewer-enter fixed inset-0 z-50 flex flex-col bg-black/92"
        style="backdrop-filter: blur(6px)"
        role="dialog"
        aria-modal="true"
        [attr.aria-label]="'Image viewer: ' + imageName()"
      >
        <!-- ── Top toolbar ─────────────────────────────────────── -->
        <header class="flex shrink-0 items-center justify-between gap-3 border-b border-white/10 bg-white/4 px-4 py-2.5">

          <!-- File name -->
          <div class="flex min-w-0 items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" class="size-4 shrink-0 text-sky-400" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" stroke-width="1.75" aria-hidden="true">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <circle cx="8.5" cy="8.5" r="1.5"/>
              <polyline points="21 15 16 10 5 21"/>
            </svg>
            <span class="truncate text-sm font-medium text-slate-200" [title]="imageName()">{{ imageName() }}</span>
          </div>

          <!-- Zoom + close controls -->
          <div class="flex shrink-0 items-center gap-1.5">

            <button type="button"
              class="flex size-7 items-center justify-center rounded bg-white/7 text-slate-300 transition hover:bg-white/14 hover:text-white active:scale-95"
              aria-label="Zoom out" title="Zoom out" (click)="zoomOut()">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>

            <button type="button"
              class="min-w-14 rounded bg-white/7 px-2 py-1 text-center font-mono text-xs font-semibold text-sky-300 transition hover:bg-white/14 hover:text-sky-200 active:scale-95"
              aria-label="Reset zoom" title="Reset zoom" (click)="resetView()">
              {{ zoomLabel() }}
            </button>

            <button type="button"
              class="flex size-7 items-center justify-center rounded bg-white/7 text-slate-300 transition hover:bg-white/14 hover:text-white active:scale-95"
              aria-label="Zoom in" title="Zoom in" (click)="zoomIn()">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
              </svg>
            </button>

            <div class="mx-1.5 h-5 w-px shrink-0 bg-white/15"></div>

            <button type="button"
              class="flex size-7 items-center justify-center rounded bg-white/7 text-slate-400 transition hover:bg-red-500/75 hover:text-white active:scale-95"
              aria-label="Close viewer" title="Close (Esc)" (click)="closeViewer()">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-3.5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </header>

        <!-- ── Main viewport ───────────────────────────────────── -->
        <div class="relative flex flex-1 items-center overflow-hidden">

          <!-- Backdrop click-to-close -->
          <button type="button" class="absolute inset-0 cursor-default focus:outline-none"
            aria-label="Close viewer" tabindex="-1" (click)="closeViewer()"></button>

          <!-- Prev arrow -->
          @if (canPrev()) {
            <button type="button"
              class="absolute left-3 z-20 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/75 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-white/30 hover:bg-black/70 hover:text-white active:scale-95"
              aria-label="Previous image (←)" title="Previous (←)" (click)="goPrev()">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
            </button>
          }

          <!-- Next arrow -->
          @if (canNext()) {
            <button type="button"
              class="absolute right-3 z-20 flex size-11 items-center justify-center rounded-full border border-white/15 bg-black/50 text-white/75 shadow-xl backdrop-blur-sm transition hover:scale-105 hover:border-white/30 hover:bg-black/70 hover:text-white active:scale-95"
              aria-label="Next image (→)" title="Next (→)" (click)="goNext()">
              <svg xmlns="http://www.w3.org/2000/svg" class="size-5" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
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
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3"
                aria-live="polite" aria-label="Loading image">
                <svg class="spinner size-10 text-sky-400/60"
                  xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
                  <circle class="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="3"/>
                  <path class="opacity-80" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                </svg>
                <span class="text-xs text-slate-500">Loading…</span>
              </div>
            }

            <!-- Error state -->
            @if (hasError()) {
              <div class="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <svg xmlns="http://www.w3.org/2000/svg" class="size-12 text-red-400/60" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                <p class="text-sm text-slate-400">Could not load image</p>
              </div>
            }

            <img
              [src]="imageUrl() ?? ''"
              [alt]="imageName()"
              class="absolute left-1/2 top-1/2 max-h-full max-w-full select-none"
              draggable="false"
              [style.transform]="transformStyle()"
              [style.transform-origin]="'center center'"
              [style.transition]="isPanning() ? 'none' : 'opacity 220ms ease, transform 130ms cubic-bezier(0.16,1,0.3,1)'"
              [style.opacity]="isLoading() || hasError() ? '0' : '1'"
              (load)="onImageLoad()"
              (error)="onImageError()"
            />
          </div>
        </div>

        <!-- ── Bottom status bar ───────────────────────────────── -->
        <footer class="flex shrink-0 items-center justify-between border-t border-white/7 bg-white/3 px-4 py-2">

          <!-- Navigation counter -->
          <div class="w-20 text-xs">
            @if (showCounter()) {
              <span class="font-semibold tabular-nums text-slate-400">
                {{ imageIndex() + 1 }}&hairsp;/&hairsp;{{ totalImages() }}
              </span>
            }
          </div>

          <!-- Hints (center) -->
          <div class="hidden items-center gap-2 text-xs text-slate-600 sm:flex">
            <span>Scroll to zoom</span>
            <span class="text-slate-700">·</span>
            <span>Drag to pan</span>
            <span class="text-slate-700">·</span>
            <span>Double-click to fit</span>
            @if (canPrev() || canNext()) {
              <span class="text-slate-700">·</span>
              <span>← → navigate</span>
            }
          </div>

          <!-- Right spacer to balance counter -->
          <div class="w-20"></div>
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
