import { DecimalPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';

import { StorageApiService } from '../../core/api/storage-api.service';
import { StorageStats } from '../../core/models/api.models';

@Component({
  selector: 'app-storage-page',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Storage</h1>
        <button
          type="button"
          class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
          [disabled]="loading()"
          (click)="load()"
        >
          Refresh
        </button>
      </header>

      <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading()) {
          <p class="text-sm text-zinc-400">Loading storage statistics...</p>
        } @else if (stats()) {
          <div class="grid gap-4 sm:grid-cols-3">
            <div class="rounded-xl border border-white/5 bg-white/5 p-5">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-600/20">
                  <i class="fa-solid fa-hard-drive text-lg text-violet-400"></i>
                </div>
                <div>
                  <p class="text-xs font-medium text-zinc-400">Total Size</p>
                  <p class="text-xl font-bold text-white">{{ stats()!.total_size_human }}</p>
                </div>
              </div>
              <p class="mt-2 text-xs text-zinc-500">{{ stats()!.total_size | number }} bytes</p>
            </div>

            <div class="rounded-xl border border-white/5 bg-white/5 p-5">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20">
                  <i class="fa-solid fa-file text-lg text-emerald-400"></i>
                </div>
                <div>
                  <p class="text-xs font-medium text-zinc-400">Files</p>
                  <p class="text-xl font-bold text-white">{{ stats()!.file_count | number }}</p>
                </div>
              </div>
            </div>

            <div class="rounded-xl border border-white/5 bg-white/5 p-5">
              <div class="flex items-center gap-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-600/20">
                  <i class="fa-solid fa-folder text-lg text-amber-400"></i>
                </div>
                <div>
                  <p class="text-xs font-medium text-zinc-400">Directories</p>
                  <p class="text-xl font-bold text-white">{{ stats()!.directory_count | number }}</p>
                </div>
              </div>
            </div>
          </div>
        } @else {
          <p class="text-sm text-zinc-400">No storage data available.</p>
        }
      </section>
    </section>
  `,
})
export class StoragePage {
  private readonly storageApi = inject(StorageApiService);

  readonly stats = signal<StorageStats | null>(null);
  readonly loading = signal(false);

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.storageApi.getStats().subscribe({
      next: (data) => {
        this.stats.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }
}
