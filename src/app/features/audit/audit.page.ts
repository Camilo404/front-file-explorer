import { DatePipe, JsonPipe, NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, map, of, startWith, switchMap, tap } from 'rxjs';

import { AuditApiService, AuditQuery } from '../../core/api/audit-api.service';
import { AuditEntry } from '../../core/models/api.models';

@Component({
  selector: 'app-audit-page',
  imports: [ReactiveFormsModule, DatePipe, JsonPipe, NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex h-full flex-col gap-6 p-4 md:p-6 max-w-7xl mx-auto w-full">
      <header class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Audit Logs</h1>
          <p class="text-sm text-zinc-400">Track system activities and security events</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            type="button"
            (click)="refresh()"
            class="inline-flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-zinc-200 transition-colors hover:bg-zinc-700 hover:text-white focus:outline-none focus:ring-2 focus:ring-zinc-600"
          >
            <i class="fa-solid fa-rotate-right" [class.fa-spin]="isLoading()"></i>
            Refresh
          </button>
        </div>
      </header>

      <!-- Filters -->
      <form
        [formGroup]="form"
        (ngSubmit)="applyFilters()"
        class="grid gap-3 rounded-xl border border-white/5 bg-zinc-900/50 p-4 shadow-sm backdrop-blur-sm md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6"
      >
        <div class="relative">
          <i class="fa-solid fa-bolt absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <input
            formControlName="action"
            type="text"
            placeholder="Action"
            class="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
        
        <div class="relative">
          <i class="fa-solid fa-user absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <input
            formControlName="actor_id"
            type="text"
            placeholder="Actor ID"
            class="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <div class="relative">
          <i class="fa-solid fa-info-circle absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <select
            formControlName="status"
            class="w-full appearance-none rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-8 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
            <option value="error">Error</option>
          </select>
          <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-500 pointer-events-none"></i>
        </div>

        <div class="relative">
          <i class="fa-solid fa-folder absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <input
            formControlName="path"
            type="text"
            placeholder="Path / Resource"
            class="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <div class="relative">
          <i class="fa-regular fa-calendar absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"></i>
          <input
            formControlName="from"
            type="date"
            placeholder="From Date"
            class="w-full rounded-lg border border-white/10 bg-black/20 py-2 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:bg-black/40 focus:outline-none focus:ring-1 focus:ring-violet-500/50 scheme-dark"
          />
        </div>

        <div class="flex gap-2">
          <button
            type="submit"
            class="flex-1 rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 active:scale-95"
          >
            Filter
          </button>
          <button
            type="button"
            (click)="resetFilters()"
            class="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
            title="Reset Filters"
          >
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      </form>

      <!-- Data Table -->
      <div class="flex flex-col gap-4 rounded-xl border border-white/5 bg-zinc-900/50 p-4 shadow-xl backdrop-blur-sm">
        
        <!-- Pagination & Stats -->
        <div class="flex flex-col justify-between gap-4 text-xs text-zinc-400 sm:flex-row sm:items-center">
          <div class="flex items-center gap-4">
             <span class="font-medium text-zinc-300">
              Showing {{ entries().length }} of {{ totalItems() }} entries
            </span>
            @if (isLoading()) {
              <span class="flex items-center gap-2 text-violet-400">
                <i class="fa-solid fa-circle-notch fa-spin"></i> Loading...
              </span>
            }
          </div>
         
          <div class="flex items-center gap-2">
            <span class="mr-2">Page {{ page() }} of {{ totalPages() }}</span>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              [disabled]="page() <= 1 || isLoading()"
              (click)="changePage(-1)"
            >
              <i class="fa-solid fa-chevron-left"></i>
            </button>
            <button
              type="button"
              class="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/5 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed"
              [disabled]="page() >= totalPages() || isLoading()"
              (click)="changePage(1)"
            >
              <i class="fa-solid fa-chevron-right"></i>
            </button>
          </div>
        </div>

        <!-- Table -->
        <div class="overflow-hidden rounded-lg border border-white/5 bg-black/20">
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead class="bg-white/5 text-xs font-medium uppercase tracking-wider text-zinc-400">
                <tr>
                  <th class="px-4 py-3">Time</th>
                  <th class="px-4 py-3">Action</th>
                  <th class="px-4 py-3">Actor</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3">Resource</th>
                  <th class="px-4 py-3 w-10"></th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @if (entries().length === 0 && !isLoading()) {
                  <tr>
                    <td colspan="6" class="px-4 py-8 text-center text-zinc-500">
                      <div class="flex flex-col items-center gap-2">
                        <i class="fa-regular fa-folder-open text-2xl"></i>
                        <p>No audit records found.</p>
                      </div>
                    </td>
                  </tr>
                }
                
                @for (entry of entries(); track $index) {
                  <tr class="group transition-colors hover:bg-white/5">
                    <td class="whitespace-nowrap px-4 py-3 text-zinc-300">
                      {{ entry.occurred_at | date:'MMM d, y, HH:mm:ss' }}
                    </td>
                    <td class="px-4 py-3">
                      <span class="font-medium text-zinc-200">{{ entry.action }}</span>
                    </td>
                    <td class="px-4 py-3 text-zinc-300">
                      <div class="flex items-center gap-2">
                        <div class="flex h-6 w-6 items-center justify-center rounded-full bg-violet-500/20 text-xs text-violet-300">
                          {{ (entry.actor.username || 'S').charAt(0).toUpperCase() }}
                        </div>
                        <span>{{ entry.actor.username || entry.actor.user_id || 'System' }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        [ngClass]="{
                          'bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20': entry.status === 'success',
                          'bg-red-500/10 text-red-400 ring-1 ring-red-500/20': entry.status !== 'success'
                        }"
                      >
                        {{ entry.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 font-mono text-xs truncate max-w-[200px]" [title]="entry.resource">
                      {{ entry.resource || '-' }}
                    </td>
                    <td class="px-4 py-3 text-right">
                      <button
                        (click)="toggleDetails(entry)"
                        class="text-zinc-500 transition-colors hover:text-zinc-300"
                        title="View Details"
                      >
                         <i class="fa-solid" [class.fa-chevron-down]="expandedEntry() !== entry" [class.fa-chevron-up]="expandedEntry() === entry"></i>
                      </button>
                    </td>
                  </tr>
                  
                  @if (expandedEntry() === entry) {
                    <tr class="bg-black/20">
                      <td colspan="6" class="px-4 py-3">
                        <div class="grid gap-4 rounded-lg border border-white/5 bg-black/20 p-4 text-xs">
                          @if (entry.error) {
                            <div class="space-y-1">
                              <span class="font-semibold text-red-400">Error:</span>
                              <pre class="whitespace-pre-wrap text-red-300/80">{{ entry.error }}</pre>
                            </div>
                          }
                          
                          @if (entry.before || entry.after) {
                            <div class="grid grid-cols-2 gap-4">
                              @if (entry.before) {
                                <div>
                                  <span class="mb-1 block font-semibold text-zinc-400">Before:</span>
                                  <pre class="max-h-40 overflow-auto rounded bg-black/40 p-2 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700">{{ entry.before | json }}</pre>
                                </div>
                              }
                              @if (entry.after) {
                                <div>
                                  <span class="mb-1 block font-semibold text-zinc-400">After:</span>
                                  <pre class="max-h-40 overflow-auto rounded bg-black/40 p-2 text-zinc-300 scrollbar-thin scrollbar-thumb-zinc-700">{{ entry.after | json }}</pre>
                                </div>
                              }
                            </div>
                          } @else if (!entry.error) {
                            <p class="text-zinc-500 italic">No additional details available.</p>
                          }
                        </div>
                      </td>
                    </tr>
                  }
                }
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class AuditPage {
  private readonly fb = inject(FormBuilder);
  private readonly auditApi = inject(AuditApiService);

  readonly form = this.fb.nonNullable.group({
    action: [''],
    actor_id: [''],
    status: [''],
    path: [''],
    from: [''],
    to: [''],
  });

  // Signals for pagination and state
  readonly page = signal(1);
  readonly limit = signal(20);
  readonly expandedEntry = signal<AuditEntry | null>(null);
  readonly refreshTrigger = signal(0);

  // Derived state for API call
  private readonly query$ = computed(() => {
    return {
      page: this.page(),
      limit: this.limit(),
      trigger: this.refreshTrigger(),
    };
  });

  // Resource stream
  private readonly auditResource = toSignal(
    toObservable(this.query$).pipe(
      debounceTime(100),
      switchMap(({ page, limit }) => {
        this.isLoading.set(true);
        const query: AuditQuery = {
          ...this.form.getRawValue(),
          page,
          limit,
        };
        // Clean up empty strings
        Object.keys(query).forEach((key) => {
           const k = key as keyof AuditQuery;
           if (query[k] === '') delete query[k];
        });

        return this.auditApi.list(query).pipe(
          map((res) => ({
            items: res.data.items,
            total: res.meta?.total ?? 0,
            totalPages: res.meta?.total_pages ?? 1,
          })),
          catchError(() => of({ items: [], total: 0, totalPages: 1 })),
          tap(() => this.isLoading.set(false))
        );
      })
    ),
    { initialValue: { items: [], total: 0, totalPages: 1 } }
  );

  readonly entries = computed(() => this.auditResource().items);
  readonly totalItems = computed(() => this.auditResource().total);
  readonly totalPages = computed(() => this.auditResource().totalPages);
  readonly isLoading = signal(false);

  applyFilters(): void {
    this.page.set(1);
    this.refreshTrigger.update((v) => v + 1);
  }

  resetFilters(): void {
    this.form.reset();
    this.applyFilters();
  }

  refresh(): void {
    this.refreshTrigger.update((v) => v + 1);
  }

  changePage(offset: number): void {
    const nextPage = this.page() + offset;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }
    this.page.set(nextPage);
  }

  toggleDetails(entry: AuditEntry): void {
    this.expandedEntry.update((current) => (current === entry ? null : entry));
  }
}
