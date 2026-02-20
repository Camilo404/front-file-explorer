import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { ConflictPolicy } from '../../core/api/operations-api.service';

@Component({
  selector: 'app-conflict-resolution-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-modal-title"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          (click)="cancel.emit()"
        ></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <div class="mb-4 flex items-start gap-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500/15">
              <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
            </div>
            <div>
              <h2 id="conflict-modal-title" class="text-base font-semibold text-white">
                Conflictos al subir
              </h2>
              <p class="mt-1 text-sm text-zinc-400">
                {{ conflictingNames().length === 1
                  ? '1 archivo ya existe'
                  : conflictingNames().length + ' archivos ya existen' }}
                en el destino. ¿Qué deseas hacer?
              </p>
            </div>
          </div>

          <ul class="mb-5 max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-white/5 px-3 py-2 space-y-1">
            @for (name of conflictingNames(); track name) {
              <li class="flex items-center gap-2 text-xs text-zinc-300">
                <i class="fa-solid fa-file-circle-exclamation fa-fw text-amber-400/80"></i>
                <span class="truncate">{{ name }}</span>
              </li>
            }
          </ul>

          <div class="flex flex-wrap justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              (click)="cancel.emit()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              (click)="resolve.emit('skip')"
            >
              Omitir
            </button>
            <button
              type="button"
              class="rounded-lg bg-violet-500/20 px-4 py-2 text-sm font-medium text-violet-400 transition-all hover:bg-violet-500/30 hover:text-violet-300"
              (click)="resolve.emit('rename')"
            >
              Renombrar
            </button>
            <button
              type="button"
              class="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/30 hover:text-red-300"
              (click)="resolve.emit('overwrite')"
            >
              Sobreescribir
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class ConflictResolutionModalComponent {
  readonly open = input(false);
  readonly conflictingNames = input<string[]>([]);

  readonly resolve = output<ConflictPolicy>();
  readonly cancel = output<void>();

  onEscape(): void {
    if (this.open()) {
      this.cancel.emit();
    }
  }
}
