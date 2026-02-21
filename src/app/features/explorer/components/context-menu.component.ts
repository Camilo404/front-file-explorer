import { DOCUMENT } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';

export type ContextMenuAction = 'rename' | 'move' | 'copy' | 'delete' | 'download' | 'info' | 'share';

@Component({
  selector: 'app-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <!-- Backdrop: covers screen on mobile, transparent on desktop -->
      <div
        class="fixed inset-0 z-40"
        [class.bg-black/50]="isMobile()"
        [class.backdrop-blur-sm]="isMobile()"
        (click)="close.emit()"
        aria-hidden="true"
      ></div>

      <div
        [class]="isMobile()
          ? 'fixed inset-x-0 bottom-0 z-50 overflow-hidden rounded-t-3xl border-t border-white/5 bg-zinc-950/95 p-3 pb-8 text-sm text-zinc-200 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5'
          : 'fixed z-50 min-w-48 overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/80 p-2 text-sm text-zinc-200 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5'"
        [style.left]="isMobile() ? null : clampedX() + 'px'"
        [style.top]="isMobile() ? null : clampedY() + 'px'"
        (click)="$event.stopPropagation()"
      >
        <!-- Mobile drag handle -->
        @if (isMobile()) {
          <div class="mb-2 flex justify-center" aria-hidden="true">
            <div class="h-1 w-10 rounded-full bg-white/20"></div>
          </div>
        }
        <div class="px-2 py-1.5 text-xs font-medium text-zinc-400">
          {{ selectedCount() }} seleccionado{{ selectedCount() !== 1 ? 's' : '' }}
        </div>
        <div class="my-1 h-px bg-white/10"></div>
        
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('rename')"
        >
          <i class="fa-solid fa-pen-to-square fa-fw text-zinc-400"></i>
          Renombrar
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
          [disabled]="selectedCount() === 0"
          (click)="onAction('move')"
        >
          <i class="fa-solid fa-arrow-right-to-bracket fa-fw text-zinc-400"></i>
          Mover
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
          [disabled]="selectedCount() === 0"
          (click)="onAction('copy')"
        >
          <i class="fa-solid fa-copy fa-fw text-zinc-400"></i>
          Copiar
        </button>

        <div class="my-1 h-px bg-white/10"></div>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('download')"
        >
          <i class="fa-solid fa-download fa-fw text-zinc-400"></i>
          Descargar
        </button>

        @if (canShare()) {
          <button
            type="button"
            class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
            [disabled]="selectedCount() !== 1"
            (click)="onAction('share')"
          >
            <i class="fa-solid fa-share-nodes fa-fw text-zinc-400"></i>
            Compartir
          </button>
        }

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-zinc-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('info')"
        >
          <i class="fa-solid fa-circle-info fa-fw text-zinc-400"></i>
          Información
        </button>

        <div class="my-1 h-px bg-white/10"></div>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-red-400 transition-colors hover:bg-red-500/20 hover:text-red-300 disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-red-400"
          [disabled]="selectedCount() === 0"
          (click)="onAction('delete')"
        >
          <i class="fa-solid fa-trash-can fa-fw"></i>
          Eliminar
        </button>
      </div>
    }
  `,
})
export class ContextMenuComponent {
  private readonly doc = inject(DOCUMENT);

  readonly isOpen = input(false);
  readonly x = input(0);
  readonly y = input(0);
  readonly selectedCount = input(0);
  readonly canShare = input(false);

  readonly action = output<ContextMenuAction>();
  readonly close = output<void>();

  /** True when the viewport is narrower than the sm breakpoint (640 px). */
  readonly isMobile = computed(() => {
    // Depend on x/y so this re-evaluates every time the menu opens.
    this.x(); this.y();
    return (this.doc.defaultView?.innerWidth ?? 1024) < 640;
  });

  /** Clamped X position so the menu never overflows the right edge. */
  readonly clampedX = computed(() => {
    const menuW = 210; // slightly bigger than min-w-48 (192px) for safety
    const vw = this.doc.defaultView?.innerWidth ?? 1024;
    return Math.max(8, Math.min(this.x(), vw - menuW - 8));
  });

  /** Clamped Y position so the menu never overflows the bottom edge. */
  readonly clampedY = computed(() => {
    const menuH = 330; // approximate height of the menu
    const vh = this.doc.defaultView?.innerHeight ?? 768;
    return Math.max(8, Math.min(this.y(), vh - menuH - 8));
  });

  onAction(actionType: ContextMenuAction): void {
    this.action.emit(actionType);
    this.close.emit();
  }
}

