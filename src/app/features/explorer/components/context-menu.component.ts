import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

export type ContextMenuAction = 'rename' | 'move' | 'copy' | 'delete' | 'download' | 'info';

@Component({
  selector: 'app-context-menu',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div
        class="fixed z-50 min-w-48 overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 p-1.5 text-sm text-slate-200 shadow-2xl backdrop-blur-xl"
        [style.left.px]="x()"
        [style.top.px]="y()"
        (click)="$event.stopPropagation()"
      >
        <div class="px-2 py-1.5 text-xs font-medium text-slate-400">
          {{ selectedCount() }} seleccionado{{ selectedCount() !== 1 ? 's' : '' }}
        </div>
        <div class="my-1 h-px bg-white/10"></div>
        
        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('rename')"
        >
          <i class="fa-solid fa-pen-to-square fa-fw text-slate-400"></i>
          Renombrar
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-200"
          [disabled]="selectedCount() === 0"
          (click)="onAction('move')"
        >
          <i class="fa-solid fa-arrow-right-to-bracket fa-fw text-slate-400"></i>
          Mover
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-200"
          [disabled]="selectedCount() === 0"
          (click)="onAction('copy')"
        >
          <i class="fa-solid fa-copy fa-fw text-slate-400"></i>
          Copiar
        </button>

        <div class="my-1 h-px bg-white/10"></div>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('download')"
        >
          <i class="fa-solid fa-download fa-fw text-slate-400"></i>
          Descargar
        </button>

        <button
          type="button"
          class="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-transparent disabled:hover:text-slate-200"
          [disabled]="selectedCount() !== 1"
          (click)="onAction('info')"
        >
          <i class="fa-solid fa-circle-info fa-fw text-slate-400"></i>
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
  readonly isOpen = input(false);
  readonly x = input(0);
  readonly y = input(0);
  readonly selectedCount = input(0);

  readonly action = output<ContextMenuAction>();
  readonly close = output<void>();

  onAction(actionType: ContextMenuAction): void {
    this.action.emit(actionType);
    this.close.emit();
  }
}

