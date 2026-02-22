import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { OperationsApiService } from '../../core/api/operations-api.service';
import { TrashApiService } from '../../core/api/trash-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { TrashRecord } from '../../core/models/api.models';

@Component({
  selector: 'app-trash-page',
  imports: [FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Trash</h1>
          <p class="text-sm text-zinc-400">Manage deleted files and restore them if needed</p>
        </div>
        
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
            <input
              type="text"
              [ngModel]="searchText()"
              (ngModelChange)="searchText.set($event); page.set(1)"
              placeholder="Search by path or user..."
              class="h-9 w-64 rounded-lg border border-white/10 bg-zinc-900/50 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
          
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
            [disabled]="loading()"
            (click)="load()"
          >
            <i class="fa-solid fa-rotate-right" [class.fa-spin]="loading()"></i>
            Refresh
          </button>

          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 disabled:opacity-40"
            [disabled]="emptyingTrash() || activeTrashCount() === 0"
            (click)="emptyAllTrash()"
          >
            @if (emptyingTrash()) {
              <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
            } @else {
              <i class="fa-solid fa-dumpster-fire text-xs"></i>
            }
            Empty Trash
          </button>
        </div>
      </header>

      <!-- Mobile Search & Filters -->
      <div class="flex flex-col gap-3 sm:hidden">
        <div class="relative">
          <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
          <input
            type="text"
            [ngModel]="searchText()"
            (ngModelChange)="searchText.set($event); page.set(1)"
            placeholder="Search..."
            class="h-9 w-full rounded-lg border border-white/10 bg-zinc-900/50 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="flex flex-wrap items-center gap-3">
        <label class="flex items-center gap-2 cursor-pointer select-none rounded-lg border border-white/5 bg-zinc-900/40 px-3 py-1.5 text-xs text-zinc-400 hover:bg-white/5 hover:text-zinc-200 transition-colors">
          <input
            type="checkbox"
            [checked]="includeRestored()"
            (change)="toggleIncludeRestored($event)"
            class="rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
          />
          Show Restored Items
        </label>
        
        @if (selectedIds().length > 0) {
          <div class="flex items-center gap-2 ml-auto animate-in fade-in slide-in-from-right-4 duration-200">
            <span class="text-xs text-zinc-400">{{ selectedIds().length }} selected</span>
            <div class="h-4 w-px bg-white/10 mx-1"></div>
            <button
              type="button"
              class="rounded-md bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 hover:bg-emerald-500/20"
              (click)="restoreSelected()"
              [disabled]="restoringPath() !== null"
            >
              Restore Selected
            </button>
            <button
              type="button"
              class="rounded-md bg-red-500/10 px-2 py-1 text-xs font-medium text-red-400 hover:bg-red-500/20"
              (click)="deleteSelected()"
              [disabled]="deletingId() !== null"
            >
              Delete Selected
            </button>
          </div>
        }
      </div>

      <!-- Trash List -->
      <section class="overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading() && records().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-3"></i>
            <p class="text-sm">Loading trash...</p>
          </div>
        } @else if (filteredRecords().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3">
              <i class="fa-solid fa-trash text-xl opacity-50"></i>
            </div>
            <p class="text-sm font-medium text-zinc-400">Trash is empty</p>
            <p class="text-xs text-zinc-600">
              {{ searchText() ? 'Try different search terms' : 'Deleted files will appear here' }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-white/5 bg-white/5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  <th class="w-10 px-4 py-3 text-center">
                    <input 
                      type="checkbox" 
                      [checked]="areAllPageSelected()"
                      [indeterminate]="isPagePartiallySelected()"
                      (change)="toggleSelectAllPage()"
                      class="rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
                    />
                  </th>
                  <th class="px-4 py-3">Original Path</th>
                  <th class="px-4 py-3">Deleted</th>
                  <th class="px-4 py-3">Deleted By</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (record of pagedRecords(); track record.id) {
                  <tr 
                    class="group transition-colors hover:bg-white/2"
                    [class.bg-white/[0.04]]="isSelected(record.id)"
                  >
                    <td class="px-4 py-3 text-center">
                      <input 
                        type="checkbox" 
                        [checked]="isSelected(record.id)"
                        (change)="toggleSelection(record.id)"
                        class="rounded border-zinc-700 bg-zinc-800 text-violet-500 focus:ring-violet-500/50 focus:ring-offset-0"
                      />
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2 font-mono text-xs text-zinc-300 break-all">
                        <i class="fa-regular fa-file text-zinc-500 shrink-0"></i>
                        {{ record.original_path }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {{ record.deleted_at | date:'mediumDate' }}
                      <span class="text-zinc-600 block text-[10px]">{{ record.deleted_at | date:'shortTime' }}</span>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 text-xs whitespace-nowrap">
                      {{ record.deleted_by.username || 'System' }}
                    </td>
                    <td class="px-4 py-3">
                      @if (record.restored_at) {
                        <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Restored
                        </span>
                      } @else {
                        <span class="inline-flex items-center rounded-full bg-amber-500/10 px-2 py-0.5 text-[10px] font-medium text-amber-400 ring-1 ring-inset ring-amber-500/20">
                          Active
                        </span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-emerald-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 disabled:opacity-50"
                          [disabled]="!canRestore(record) || restoringPath() === record.original_path"
                          title="Restore"
                          (click)="restore(record)"
                        >
                          <i class="fa-solid fa-rotate-left text-xs"></i>
                        </button>
                        
                        @if (!record.restored_at) {
                          <button
                            type="button"
                            class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                            [disabled]="deletingId() === record.id"
                            title="Delete Permanently"
                            (click)="permanentDelete(record)"
                          >
                            @if (deletingId() === record.id) {
                              <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                            } @else {
                              <i class="fa-solid fa-trash text-xs"></i>
                            }
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between border-t border-white/5 bg-white/2 px-4 py-3">
            <span class="text-xs text-zinc-500">
              Page {{ page() }} of {{ totalPages() }} • {{ filteredRecords().length }} items
            </span>
            <div class="flex gap-2">
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
                [disabled]="page() <= 1"
                (click)="changePage(-1)"
              >
                Previous
              </button>
              <button
                type="button"
                class="inline-flex items-center justify-center rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
                [disabled]="page() >= totalPages()"
                (click)="changePage(1)"
              >
                Next
              </button>
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
  readonly selectedIds = signal<string[]>([]);

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

  readonly areAllPageSelected = computed(() => {
    const pageIds = this.pagedRecords().map(r => r.id);
    return pageIds.length > 0 && pageIds.every(id => this.selectedIds().includes(id));
  });

  readonly isPagePartiallySelected = computed(() => {
    const pageIds = this.pagedRecords().map(r => r.id);
    const selectedCount = pageIds.filter(id => this.selectedIds().includes(id)).length;
    return selectedCount > 0 && selectedCount < pageIds.length;
  });

  constructor() {
    this.load();
  }

  toggleIncludeRestored(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.includeRestored.set(input.checked);
    this.page.set(1);
    this.selectedIds.set([]); // Clear selection when filter changes
    this.load();
  }

  changePage(offset: number): void {
    const nextPage = this.page() + offset;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }
    this.page.set(nextPage);
    // Optional: Clear selection on page change? Or keep it? keeping it for now.
  }

  load(): void {
    this.loading.set(true);
    this.trashApi.list(this.includeRestored()).subscribe({
      next: (result) => {
        this.records.set(result.items);
        this.page.set(1);
        this.loading.set(false);
        this.selectedIds.set([]); // Reset selection on reload
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
          this.feedback.success('RESTORE', `Restored: ${record.original_path}`);
        }
        if (result.failed.length > 0) {
          const reason = result.failed[0]?.reason ?? 'restore failed';
          this.feedback.warning('RESTORE', `Could not restore ${record.original_path}: ${reason}`);
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

  // Selection Logic
  isSelected(id: string): boolean {
    return this.selectedIds().includes(id);
  }

  toggleSelection(id: string): void {
    this.selectedIds.update(ids => {
      if (ids.includes(id)) {
        return ids.filter(i => i !== id);
      }
      return [...ids, id];
    });
  }

  toggleSelectAllPage(): void {
    const pageIds = this.pagedRecords().map(r => r.id);
    if (this.areAllPageSelected()) {
      // Deselect all on this page
      this.selectedIds.update(ids => ids.filter(id => !pageIds.includes(id)));
    } else {
      // Select all on this page
      this.selectedIds.update(ids => [...new Set([...ids, ...pageIds])]);
    }
  }

  // Bulk Actions
  restoreSelected(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const itemsToRestore = this.records().filter(r => ids.includes(r.id) && !r.restored_at);
    if (itemsToRestore.length === 0) return;

    const paths = itemsToRestore.map(r => r.original_path);
    
    if (!confirm(`Restore ${itemsToRestore.length} selected items?`)) return;

    // Use the first one for "restoringPath" just to show loading state if needed, 
    // but ideally we'd have a general loading state for bulk ops.
    this.restoringPath.set(paths[0]); 

    this.operationsApi.restore(paths).subscribe({
      next: (result) => {
        this.restoringPath.set(null);
        this.selectedIds.set([]); // Clear selection
        
        const successCount = result.restored.length;
        const failCount = result.failed.length;
        
        if (successCount > 0) {
          this.feedback.success('RESTORE', `Restored ${successCount} items successfully.`);
        }
        if (failCount > 0) {
          this.feedback.warning('RESTORE', `Failed to restore ${failCount} items.`);
        }
        this.load();
      },
      error: () => {
        this.restoringPath.set(null);
      }
    });
  }

  deleteSelected(): void {
    const ids = this.selectedIds();
    if (ids.length === 0) return;

    const itemsToDelete = this.records().filter(r => ids.includes(r.id) && !r.restored_at);
    
    if (itemsToDelete.length === 0) return;
    
    if (!confirm(`Permanently delete ${itemsToDelete.length} selected items? This cannot be undone.`)) return;

    // We don't have a bulk permanent delete by ID API yet in operations service? 
    // The trashApi.permanentDelete takes a single ID.
    // However, looking at the code, we might need to do this one by one or add a bulk endpoint.
    // Let's check operationsApi... operationsApi.delete is for SOFT delete (move to trash).
    // We need PERMANENT delete from trash.
    // The TrashApiService only has permanentDelete(id) and emptyTrash().
    // So for now, we will do parallel requests or sequence them. Parallel is fine for a few items.
    
    // Actually, let's just do one by one for now as a simple implementation, or maybe just block it if it's too many?
    // Let's implement a simple loop for now.
    
    let completed = 0;
    let errors = 0;
    const total = itemsToDelete.length;
    
    // Show some loading state
    this.deletingId.set(itemsToDelete[0].id); // Just to trigger some UI feedback

    // Execute in parallel with limit? Or just all at once for now (assuming user won't select 1000s)
    // To be safe, let's use a simple Promise.all
    
    const deletePromises = itemsToDelete.map(item => 
      new Promise<void>((resolve) => {
        this.trashApi.permanentDelete(item.id).subscribe({
          next: () => {
            completed++;
            resolve();
          },
          error: () => {
            errors++;
            resolve();
          }
        });
      })
    );

    Promise.all(deletePromises).then(() => {
      this.deletingId.set(null);
      this.selectedIds.set([]);
      if (errors > 0) {
        this.feedback.warning('TRASH', `Deleted ${completed} items. Failed to delete ${errors} items.`);
      } else {
        this.feedback.success('TRASH', `Permanently deleted ${completed} items.`);
      }
      this.load();
    });
  }
}
