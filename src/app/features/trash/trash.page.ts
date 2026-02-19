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
      <header class="flex items-center justify-between">
        <h1 class="text-lg font-semibold">Trash</h1>
        <div class="flex items-center gap-2 text-xs">
          <input
            type="text"
            [value]="searchText()"
            placeholder="Filtrar por path o usuario"
            class="rounded border border-slate-700 bg-slate-950 px-2 py-1"
            (input)="onSearchInput($event)"
          />
          <label class="flex items-center gap-2 rounded border border-slate-700 bg-slate-900 px-2 py-1">
            <input
              type="checkbox"
              [checked]="includeRestored()"
              (change)="toggleIncludeRestored($event)"
            />
            Incluir restaurados
          </label>
          <button
            type="button"
            class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
            (click)="load()"
          >
            Refresh
          </button>
        </div>
      </header>

      <section class="rounded border border-slate-800 bg-slate-900 p-3">
        @if (loading()) {
          <p class="text-sm text-slate-400">Cargando papelera...</p>
        } @else if (records().length === 0) {
          <p class="text-sm text-slate-400">No hay elementos en papelera.</p>
        } @else if (pagedRecords().length === 0) {
          <p class="text-sm text-slate-400">No hay resultados para el filtro actual.</p>
        } @else {
          <div class="overflow-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-slate-800">
                  <th class="px-2 py-1">Original Path</th>
                  <th class="px-2 py-1">Deleted At</th>
                  <th class="px-2 py-1">Deleted By</th>
                  <th class="px-2 py-1">Status</th>
                  <th class="px-2 py-1">Action</th>
                </tr>
              </thead>
              <tbody>
                @for (record of pagedRecords(); track record.id) {
                  <tr class="border-b border-slate-800/50">
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
                      <button
                        type="button"
                        class="rounded bg-emerald-700 px-2 py-1 hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
                        [disabled]="!canRestore(record) || restoringPath() === record.original_path"
                        (click)="restore(record)"
                      >
                        Restore
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>

            <div class="mt-3 flex items-center justify-between text-xs">
              <span class="text-slate-400">Página {{ page() }}/{{ totalPages() }} | Total {{ filteredRecords().length }}</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
                  [disabled]="page() <= 1"
                  (click)="changePage(-1)"
                >
                  Prev
                </button>
                <button
                  type="button"
                  class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
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
  readonly searchText = signal('');
  readonly page = signal(1);
  readonly limit = signal(25);

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

  canRestore(record: TrashRecord): boolean {
    return !record.restored_at;
  }
}
