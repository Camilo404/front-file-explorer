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
        class="fixed inset-0 z-60 flex items-center justify-center p-4 font-sans"
        role="dialog"
        aria-modal="true"
        aria-labelledby="conflict-modal-title"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
          (click)="cancel.emit()"
        ></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-md scale-100 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="border-b border-white/5 bg-white/5 p-6">
            <div class="flex items-start gap-4">
              <div class="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 shadow-inner ring-1 ring-amber-500/20">
                <i class="fa-solid fa-triangle-exclamation text-xl text-amber-500"></i>
              </div>
              <div class="flex-1">
                <h2 id="conflict-modal-title" class="text-lg font-bold tracking-tight text-white">
                  Conflicts detected
                </h2>
                <p class="mt-1 text-sm text-zinc-400 leading-relaxed">
                  {{ conflictingNames().length === 1
                    ? 'A file with the same name already exists'
                    : conflictingNames().length + ' files with the same name were found' }}
                  in the destination.
                </p>
              </div>
            </div>
          </div>

          <!-- Body -->
          <div class="p-6">
            <div class="mb-6">
              <h3 class="mb-3 text-xs font-semibold uppercase tracking-wider text-zinc-500">Affected files</h3>
              <ul class="max-h-48 overflow-y-auto custom-scrollbar rounded-xl border border-white/5 bg-black/20 p-2">
                @for (name of conflictingNames(); track name) {
                  <li class="flex items-center gap-3 rounded-lg p-2 transition-colors hover:bg-white/5">
                    <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <i class="fa-solid fa-file text-zinc-400 text-xs"></i>
                    </div>
                    <span class="truncate text-sm text-zinc-300 font-medium">{{ name }}</span>
                  </li>
                }
              </ul>
            </div>

            <!-- Actions -->
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <button
                type="button"
                class="group relative flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 active:scale-95"
                (click)="resolve.emit('rename')"
              >
                <i class="fa-solid fa-pen-to-square"></i>
                Rename (keep both)
              </button>
              
              <button
                type="button"
                class="group relative flex items-center justify-center gap-2 rounded-xl bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-400 ring-1 ring-red-500/20 transition-all hover:bg-red-500/20 active:scale-95"
                (click)="resolve.emit('overwrite')"
              >
                <i class="fa-solid fa-file-circle-check"></i>
                Replace
              </button>

              <button
                type="button"
                class="group relative flex items-center justify-center gap-2 rounded-xl bg-white/5 px-4 py-3 text-sm font-semibold text-zinc-300 ring-1 ring-white/10 transition-all hover:bg-white/10 hover:text-white active:scale-95"
                (click)="resolve.emit('skip')"
              >
                <i class="fa-solid fa-forward"></i>
                Skip these files
              </button>

              <button
                type="button"
                class="group relative flex items-center justify-center gap-2 rounded-xl bg-transparent px-4 py-3 text-sm font-semibold text-zinc-400 transition-all hover:text-zinc-200 hover:bg-white/5 active:scale-95"
                (click)="cancel.emit()"
              >
                Cancel operation
              </button>
            </div>
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

