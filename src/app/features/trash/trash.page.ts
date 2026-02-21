import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { OperationsApiService } from '../../core/api/operations-api.service';
import { TrashApiService } from '../../core/api/trash-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { TrashRecord } from '../../core/models/api.models';

@Component({
  selector: 'app-trash-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Trash</h1>
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <input
            type="text"
            [value]="searchText()"
            placeholder="Filtrar por path o usuario"
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            (input)="onSearchInput($event)"
          />
          <label class="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 transition-colors hover:bg-white/10">
            <input
              type="checkbox"
              [checked]="includeRestored()"
              (change)="toggleIncludeRestored($event)"
            />
            Incluir restaurados
          </label>
          <button
            type="button"
            class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5"
            (click)="load()"
          >
            Refresh
          </button>
          <button
            type="button"
            class="rounded-xl bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40"
            [disabled]="emptyingTrash() || activeTrashCount() === 0"
            (click)="emptyAllTrash()"
          >
            <i class="fa-solid fa-trash-can mr-1.5 text-xs"></i>
            {{ emptyingTrash() ? 'Emptying...' : 'Empty Trash' }}
          </button>
        </div>
      </header>

      <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading()) {
          <p class="text-sm text-zinc-400">Cargando papelera...</p>
        } @else if (records().length === 0) {
          <p class="text-sm text-zinc-400">No hay elementos en papelera.</p>
        } @else if (pagedRecords().length === 0) {
          <p class="text-sm text-zinc-400">No hay resultados para el filtro actual.</p>
        } @else {
          <div class="overflow-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-zinc-800">
                  <th class="px-2 py-1">Original Path</th>
                  <th class="px-2 py-1">Deleted At</th>
                  <th class="px-2 py-1">Deleted By</th>
                  <th class="px-2 py-1">Status</th>
                  <th class="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (record of pagedRecords(); track record.id) {
                  <tr class="border-b border-zinc-800/50">
                    <td class="px-2 py-1 font-mono text-[11px]">{{ record.original_path }}</td>
                    <td class="px-2 py-1">{{ record.deleted_at }}</td>
                    <td class="px-2 py-1">{{ record.deleted_by.username || record.deleted_by.user_id || '-' }}</td>
                    <td class="px-2 py-1">
                      @if (record.restored_at) {
                        <span class="rounded bg-emerald-900 px-2 py-0.5 text-emerald-200">restored</span>
                      } @else {
                        <span class="rounded bg-amber-900 px-2 py-0.5 text-amber-200">active</span>
                      }
                    </td>
                    <td class="px-2 py-1">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          class="rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                          [disabled]="!canRestore(record) || restoringPath() === record.original_path"
                          (click)="restore(record)"
                        >
                          Restore
                        </button>
                        @if (!record.restored_at) {
                          <button
                            type="button"
                            class="rounded bg-red-700 px-2 py-1 hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                            [disabled]="deletingId() === record.id"
                            (click)="permanentDelete(record)"
                          >
                            {{ deletingId() === record.id ? '...' : 'Delete' }}
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="mt-3 flex items-center justify-between text-xs">
              <span class="text-zinc-400">Página {{ page() }}/{{ totalPages() }} | Total {{ filteredRecords().length }}</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5"
                  [disabled]="page() <= 1"
                  (click)="changePage(-1)"
                >
                  Prev
                </button>
                <button
                  type="button"
                  class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-white/5"
                  [disabled]="page() >= totalPages()"
                  (click)="changePage(1)"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        }
      </section>
    </section>
  `,
})
export class TrashPage {
  private readonly trashApi = inject(TrashApiService);
  private readonly operationsApi = inject(OperationsApiService);
  private readonly feedback = inject(ErrorStoreService);

  readonly records = signal<TrashRecord[]>([]);
  readonly includeRestored = signal(false);
  readonly loading = signal(false);
  readonly restoringPath = signal<string | null>(null);
  readonly deletingId = signal<string | null>(null);
  readonly emptyingTrash = signal(false);
  readonly searchText = signal('');
  readonly page = signal(1);
  readonly limit = signal(25);

  readonly activeTrashCount = computed(() => this.records().filter((r) => !r.restored_at).length);

  readonly filteredRecords = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    if (!query) {
      return this.records();
    }

    return this.records().filter((record) => {
      const path = record.original_path.toLowerCase();
      const username = (record.deleted_by.username || '').toLowerCase();
      const userId = (record.deleted_by.user_id || '').toLowerCase();
      return path.includes(query) || username.includes(query) || userId.includes(query);
    });
  });

  readonly totalPages = computed(() => {
    const total = this.filteredRecords().length;
    const pages = Math.ceil(total / this.limit());
    return pages <= 0 ? 1 : pages;
  });

  readonly pagedRecords = computed(() => {
    const currentPage = Math.min(this.page(), this.totalPages());
    const start = (currentPage - 1) * this.limit();
    const end = start + this.limit();
    return this.filteredRecords().slice(start, end);
  });

  constructor() {
    this.load();
  }

  toggleIncludeRestored(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.includeRestored.set(input.checked);
    this.page.set(1);
    this.load();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value);
    this.page.set(1);
  }

  changePage(offset: number): void {
    const nextPage = this.page() + offset;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }
    this.page.set(nextPage);
  }

  load(): void {
    this.loading.set(true);

    this.trashApi.list(this.includeRestored()).subscribe({
      next: (result) => {
        this.records.set(result.items);
        this.page.set(1);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  restore(record: TrashRecord): void {
    if (record.restored_at) {
      return;
    }

    this.restoringPath.set(record.original_path);
    this.operationsApi.restore([record.original_path]).subscribe({
      next: (result) => {
        this.restoringPath.set(null);
        if (result.restored.length > 0) {
          this.feedback.success('RESTORE', `Restaurado: ${record.original_path}`);
        }
        if (result.failed.length > 0) {
          const reason = result.failed[0]?.reason ?? 'restore failed';
          this.feedback.warning('RESTORE', `No se pudo restaurar ${record.original_path}: ${reason}`);
        }
        this.load();
      },
      error: () => {
        this.restoringPath.set(null);
      },
    });
  }

  permanentDelete(record: TrashRecord): void {
    if (!confirm(`Permanently delete "${record.original_path}"? This cannot be undone.`)) {
      return;
    }

    this.deletingId.set(record.id);
    this.trashApi.permanentDelete(record.id).subscribe({
      next: () => {
        this.feedback.success('TRASH', `Permanently deleted: ${record.original_path}`);
        this.deletingId.set(null);
        this.load();
      },
      error: () => {
        this.deletingId.set(null);
      },
    });
  }

  emptyAllTrash(): void {
    if (!confirm('Permanently delete ALL items in trash? This cannot be undone.')) {
      return;
    }

    this.emptyingTrash.set(true);
    this.trashApi.emptyTrash().subscribe({
      next: (count) => {
        this.feedback.success('TRASH', `Trash emptied. ${count} item${count !== 1 ? 's' : ''} permanently deleted.`);
        this.emptyingTrash.set(false);
        this.load();
      },
      error: () => {
        this.emptyingTrash.set(false);
      },
    });
  }

  canRestore(record: TrashRecord): boolean {
    return !record.restored_at;
  }
}
