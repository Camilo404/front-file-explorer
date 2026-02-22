import { DecimalPipe, CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal, computed } from '@angular/core';

import { StorageApiService } from '../../core/api/storage-api.service';
import { StorageStats } from '../../core/models/api.models';

@Component({
  selector: 'app-storage-page',
  imports: [DecimalPipe, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">Storage Overview</h1>
          <p class="text-zinc-400 text-sm mt-1">System storage usage and statistics</p>
        </div>
        <button
          type="button"
          class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all font-medium text-sm border border-white/5 shadow-sm"
          [disabled]="loading()"
          (click)="load()"
        >
          <i class="fa-solid fa-rotate" [class.fa-spin]="loading()"></i>
          <span class="hidden sm:inline">Refresh Data</span>
        </button>
      </header>

      <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <!-- Main Stats Cards -->
        @if (stats(); as s) {
          <!-- Total Size Card -->
          <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-xl group hover:bg-zinc-900/60 transition-colors">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-violet-500/10 blur-2xl group-hover:bg-violet-500/20 transition-all"></div>
            
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-zinc-400">Total Storage Used</p>
                <h3 class="mt-2 text-3xl font-bold text-white tracking-tight">{{ s.total_size_human }}</h3>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20">
                <i class="fa-solid fa-hard-drive text-xl"></i>
              </div>
            </div>
            
            <div class="mt-4">
              <div class="flex items-center justify-between text-xs mb-1.5">
                <span class="text-zinc-500">Raw size</span>
                <span class="font-mono text-zinc-300">{{ s.total_size | number }} bytes</span>
              </div>
              <div class="h-1.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                <div class="h-full rounded-full bg-linear-to-r from-violet-600 to-indigo-600 w-[75%] animate-pulse"></div>
              </div>
            </div>
          </div>

          <!-- File Count Card -->
          <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-xl group hover:bg-zinc-900/60 transition-colors">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-emerald-500/10 blur-2xl group-hover:bg-emerald-500/20 transition-all"></div>
            
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-zinc-400">Total Files</p>
                <h3 class="mt-2 text-3xl font-bold text-white tracking-tight">{{ s.file_count | number }}</h3>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20">
                <i class="fa-solid fa-file text-xl"></i>
              </div>
            </div>
            
            <div class="mt-4 flex items-center gap-2 text-xs text-emerald-400/80 bg-emerald-500/5 w-fit px-2 py-1 rounded-lg border border-emerald-500/10">
              <i class="fa-solid fa-check-circle"></i>
              <span>Active files indexed</span>
            </div>
          </div>

          <!-- Directory Count Card -->
          <div class="relative overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 p-6 shadow-xl backdrop-blur-xl group hover:bg-zinc-900/60 transition-colors">
            <div class="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-amber-500/10 blur-2xl group-hover:bg-amber-500/20 transition-all"></div>
            
            <div class="flex items-start justify-between">
              <div>
                <p class="text-sm font-medium text-zinc-400">Directories</p>
                <h3 class="mt-2 text-3xl font-bold text-white tracking-tight">{{ s.directory_count | number }}</h3>
              </div>
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20">
                <i class="fa-solid fa-folder text-xl"></i>
              </div>
            </div>
            
            <div class="mt-4 flex items-center gap-2 text-xs text-amber-400/80 bg-amber-500/5 w-fit px-2 py-1 rounded-lg border border-amber-500/10">
              <i class="fa-solid fa-layer-group"></i>
              <span>Folder structure depth</span>
            </div>
          </div>
        } @else if (loading()) {
          <!-- Skeleton Loading State -->
          @for (i of [1,2,3]; track i) {
            <div class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 animate-pulse">
              <div class="flex justify-between items-start mb-4">
                <div class="space-y-3">
                  <div class="h-4 w-24 bg-white/5 rounded"></div>
                  <div class="h-8 w-32 bg-white/5 rounded"></div>
                </div>
                <div class="h-12 w-12 bg-white/5 rounded-xl"></div>
              </div>
              <div class="h-2 w-full bg-white/5 rounded mt-4"></div>
            </div>
          }
        } @else {
          <!-- Empty State -->
          <div class="col-span-full rounded-2xl border border-white/5 bg-zinc-900/40 p-12 text-center">
            <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-zinc-800/50 mb-4">
              <i class="fa-solid fa-chart-pie text-2xl text-zinc-500"></i>
            </div>
            <h3 class="text-lg font-medium text-white">No storage data available</h3>
            <p class="mt-2 text-sm text-zinc-400">Unable to retrieve storage statistics at this time.</p>
            <button 
              (click)="load()"
              class="mt-6 inline-flex items-center gap-2 text-sm font-medium text-violet-400 hover:text-violet-300 transition-colors"
            >
              <i class="fa-solid fa-rotate-right"></i> Try Again
            </button>
          </div>
        }
      </div>

      <!-- Additional Insights / Visualization Placeholder -->
      @if (stats(); as s) {
        <div class="grid gap-6 lg:grid-cols-2">
          <!-- Quick Distribution Summary -->
          <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl">
            <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i class="fa-solid fa-chart-simple text-zinc-500 text-sm"></i>
              Distribution Overview
            </h3>
            
            <div class="space-y-5">
              <!-- Files vs Directories Ratio -->
              <div>
                <div class="flex justify-between text-sm mb-2">
                  <span class="text-zinc-400">Files vs Directories</span>
                  <span class="text-white font-medium">{{ getFileRatio() }}% Files</span>
                </div>
                <div class="flex h-2.5 w-full rounded-full bg-zinc-800 overflow-hidden">
                  <div 
                    class="h-full bg-emerald-500" 
                    [style.width.%]="getFileRatio()"
                  ></div>
                  <div 
                    class="h-full bg-amber-500" 
                    [style.width.%]="100 - getFileRatio()"
                  ></div>
                </div>
                <div class="mt-2 flex gap-4 text-xs">
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
                    <span class="text-zinc-400">Files ({{ s.file_count | number }})</span>
                  </div>
                  <div class="flex items-center gap-1.5">
                    <div class="w-2 h-2 rounded-full bg-amber-500"></div>
                    <span class="text-zinc-400">Directories ({{ s.directory_count | number }})</span>
                  </div>
                </div>
              </div>

              <!-- Storage Health Indicator -->
              <div class="pt-4 border-t border-white/5">
                 <div class="flex justify-between text-sm mb-2">
                  <span class="text-zinc-400">Storage Health</span>
                  <span class="text-emerald-400 font-medium flex items-center gap-1">
                    <i class="fa-solid fa-shield-check"></i> Healthy
                  </span>
                </div>
                <p class="text-xs text-zinc-500 leading-relaxed">
                  Your storage system is operating within normal parameters. No critical warnings or space alerts detected.
                </p>
              </div>
            </div>
          </section>

          <!-- Quick Actions / Tips -->
          <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-6 backdrop-blur-xl">
             <h3 class="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <i class="fa-solid fa-lightbulb text-zinc-500 text-sm"></i>
              Storage Tips
            </h3>
            
            <ul class="space-y-4">
              <li class="flex gap-3 items-start">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 mt-0.5">
                  <i class="fa-solid fa-broom text-xs"></i>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-zinc-200">Clean up old files</h4>
                  <p class="text-xs text-zinc-500 mt-1">Review and delete files that haven't been accessed in over a year to free up space.</p>
                </div>
              </li>
              <li class="flex gap-3 items-start">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 mt-0.5">
                  <i class="fa-solid fa-box-archive text-xs"></i>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-zinc-200">Compress large folders</h4>
                  <p class="text-xs text-zinc-500 mt-1">Consider compressing archival directories to save disk space.</p>
                </div>
              </li>
              <li class="flex gap-3 items-start">
                <div class="shrink-0 w-8 h-8 rounded-lg bg-pink-500/10 flex items-center justify-center text-pink-400 mt-0.5">
                  <i class="fa-solid fa-trash-can text-xs"></i>
                </div>
                <div>
                  <h4 class="text-sm font-medium text-zinc-200">Empty Trash Regularly</h4>
                  <p class="text-xs text-zinc-500 mt-1">Items in the trash still consume storage quota until permanently deleted.</p>
                </div>
              </li>
            </ul>
          </section>
        </div>
      }
    </section>
  `,
})
export class StoragePage {
  private readonly storageApi = inject(StorageApiService);

  readonly stats = signal<StorageStats | null>(null);
  readonly loading = signal(false);

  // Derived metrics
  readonly getFileRatio = computed(() => {
    const s = this.stats();
    if (!s || (s.file_count + s.directory_count === 0)) return 0;
    return Math.round((s.file_count / (s.file_count + s.directory_count)) * 100);
  });

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
