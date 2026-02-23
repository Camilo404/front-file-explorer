import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { SharesApiService } from '../../core/api/shares-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { ShareRecord } from '../../core/models/api.models';
import { API_BASE_URL } from '../../core/http/api-base-url.token';

@Component({
  selector: 'app-shares-page',
  imports: [ReactiveFormsModule, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Shares</h1>
          <p class="text-sm text-zinc-400">Manage your public shared links</p>
        </div>
        <div class="flex items-center gap-3">
          <div class="relative hidden sm:block">
            <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
            <input
              type="text"
              [ngModel]="searchQuery()"
              (ngModelChange)="searchQuery.set($event)"
              placeholder="Filter shares..."
              class="h-9 w-64 rounded-lg border border-white/10 bg-zinc-900/50 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
          <button
            type="button"
            class="flex items-center gap-2 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
            [disabled]="loading()"
            (click)="loadShares()"
          >
            <i class="fa-solid fa-rotate-right" [class.fa-spin]="loading()"></i>
            Refresh
          </button>
        </div>
      </header>

      <!-- Mobile Search -->
      <div class="sm:hidden">
        <div class="relative">
          <i class="fa-solid fa-search absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
          <input
            type="text"
            [ngModel]="searchQuery()"
            (ngModelChange)="searchQuery.set($event)"
            placeholder="Filter shares..."
            class="h-9 w-full rounded-lg border border-white/10 bg-zinc-900/50 pl-9 pr-3 text-sm text-zinc-200 placeholder-zinc-500 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div class="rounded-xl border border-white/5 bg-zinc-900/40 p-4 backdrop-blur-md">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10 text-violet-400">
              <i class="fa-solid fa-share-nodes"></i>
            </div>
            <div>
              <p class="text-xs font-medium text-zinc-400">Total Active</p>
              <p class="text-xl font-bold text-zinc-100">{{ totalActiveShares() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Create share form -->
      <form
        class="grid gap-4 rounded-xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 md:grid-cols-12"
        [formGroup]="createForm"
        (ngSubmit)="createShare()"
      >
        <div class="md:col-span-6 lg:col-span-7">
          <label class="mb-1.5 block text-xs font-medium text-zinc-400">File Path</label>
          <div class="relative">
            <i class="fa-regular fa-folder absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
            <input
              type="text"
              formControlName="path"
              placeholder="/path/to/file"
              class="w-full rounded-lg border border-white/10 bg-zinc-950/50 pl-9 pr-3 py-2 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            />
          </div>
        </div>
        
        <div class="md:col-span-3 lg:col-span-3">
          <label class="mb-1.5 block text-xs font-medium text-zinc-400">Expiration</label>
          <div class="relative">
            <i class="fa-regular fa-clock absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs"></i>
            <select
              formControlName="expiresIn"
              class="w-full appearance-none rounded-lg border border-white/10 bg-zinc-950/50 pl-9 pr-8 py-2 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            >
              <option value="" class="bg-zinc-900 text-zinc-400">Default (24h)</option>
              @for (opt of durationOptions(); track opt.value) {
                <option [value]="opt.value" class="bg-zinc-900">{{ opt.label }}</option>
              }
            </select>
            <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 text-[10px] pointer-events-none"></i>
          </div>
        </div>

        <div class="flex items-end md:col-span-3 lg:col-span-2">
          <button
            type="submit"
            class="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
            [disabled]="createForm.invalid || creating()"
          >
            @if (creating()) {
              <i class="fa-solid fa-circle-notch fa-spin mr-2"></i> Creating...
            } @else {
              <i class="fa-solid fa-plus mr-2"></i> Create
            }
          </button>
        </div>
      </form>

      <!-- Shares list -->
      <section class="overflow-hidden rounded-xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading() && shares().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
            <i class="fa-solid fa-circle-notch fa-spin text-2xl mb-3"></i>
            <p class="text-sm">Loading shares...</p>
          </div>
        } @else if (filteredShares().length === 0) {
          <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 mb-3">
              <i class="fa-solid fa-share-nodes text-xl opacity-50"></i>
            </div>
            <p class="text-sm font-medium text-zinc-400">No shares found</p>
            <p class="text-xs text-zinc-600">
              {{ searchQuery() ? 'Try a different search term' : 'Create a new share to get started' }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left text-sm">
              <thead>
                <tr class="border-b border-white/5 bg-white/5 text-xs font-medium text-zinc-400 uppercase tracking-wider">
                  <th class="px-4 py-3">Path</th>
                  <th class="px-4 py-3">Created</th>
                  <th class="px-4 py-3">Expires</th>
                  <th class="px-4 py-3">Status</th>
                  <th class="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-white/5">
                @for (share of filteredShares(); track share.id) {
                  <tr class="group transition-colors hover:bg-white/2">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2 font-mono text-xs text-zinc-300">
                        <i class="fa-regular fa-file text-zinc-500"></i>
                        {{ share.path }}
                      </div>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 text-xs">
                      {{ share.created_at | date:'mediumDate' }}
                      <span class="text-zinc-600 block text-[10px]">{{ share.created_at | date:'shortTime' }}</span>
                    </td>
                    <td class="px-4 py-3 text-zinc-400 text-xs">
                      @if (share.expires_at) {
                        {{ share.expires_at | date:'mediumDate' }}
                        <span class="text-zinc-600 block text-[10px]">{{ share.expires_at | date:'shortTime' }}</span>
                      } @else {
                        <span class="text-emerald-400">Never</span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      @if (isExpired(share.expires_at)) {
                        <span class="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-medium text-red-400 ring-1 ring-inset ring-red-500/20">
                          Expired
                        </span>
                      } @else {
                        <span class="inline-flex items-center rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 ring-1 ring-inset ring-emerald-500/20">
                          Active
                        </span>
                      }
                    </td>
                    <td class="px-4 py-3 text-right">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-violet-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-violet-500/50"
                          title="Copy public link"
                          (click)="copyLink(share)"
                        >
                          <i class="fa-solid fa-link text-xs"></i>
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-red-500 hover:text-white focus:outline-none focus:ring-2 focus:ring-red-500/50 disabled:opacity-50"
                          [disabled]="revokingId() === share.id"
                          title="Revoke share"
                          (click)="revokeShare(share)"
                        >
                          @if (revokingId() === share.id) {
                            <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                          } @else {
                            <i class="fa-solid fa-trash text-xs"></i>
                          }
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </section>
    </section>
  `,
})
export class SharesPage {
  private readonly fb = inject(FormBuilder);
  private readonly sharesApi = inject(SharesApiService);
  private readonly feedback = inject(ErrorStoreService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  readonly shares = signal<ShareRecord[]>([]);
  readonly loading = signal(false);
  readonly creating = signal(false);
  readonly revokingId = signal<string | null>(null);
  readonly searchQuery = signal('');

  readonly durationOptions = signal([
    { label: '1 Hour', value: '1h' },
    { label: '24 Hours', value: '24h' },
    { label: '7 Days', value: '168h' },
    { label: '30 Days', value: '720h' },
  ]);

  readonly filteredShares = computed(() => {
    const query = this.searchQuery().toLowerCase();
    return this.shares().filter((share) => 
      share.path.toLowerCase().includes(query) || 
      share.created_by.toLowerCase().includes(query)
    );
  });

  readonly totalActiveShares = computed(() => {
    return this.shares().filter(s => !this.isExpired(s.expires_at)).length;
  });

  readonly createForm = this.fb.nonNullable.group({
    path: ['', Validators.required],
    expiresIn: [''],
  });

  constructor() {
    this.loadShares();
  }

  loadShares(): void {
    this.loading.set(true);
    this.sharesApi.list().subscribe({
      next: (data) => {
        this.shares.set(data);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  createShare(): void {
    if (this.createForm.invalid) {
      return;
    }

    const formValue = this.createForm.getRawValue();
    const payload = {
      path: formValue.path,
      ...(formValue.expiresIn ? { expires_in: formValue.expiresIn } : {}),
    };

    this.creating.set(true);
    this.sharesApi.create(payload).subscribe({
      next: (share) => {
        this.feedback.success('SHARE', `Share created for ${share.path}`);
        this.creating.set(false);
        this.createForm.reset({ path: '', expiresIn: '' });
        this.loadShares();
      },
      error: () => {
        this.creating.set(false);
      },
    });
  }

  copyLink(share: ShareRecord): void {
    const url = this.sharesApi.getAbsolutePublicDownloadUrl(share.token);
    navigator.clipboard.writeText(url).then(
      () => this.feedback.success('SHARE', 'Public link copied to clipboard!'),
      () => this.feedback.warning('SHARE', 'Could not copy link to clipboard.')
    );
  }

  revokeShare(share: ShareRecord): void {
    if (!confirm(`Revoke share for "${share.path}"?`)) {
      return;
    }

    this.revokingId.set(share.id);
    this.sharesApi.revoke(share.id).subscribe({
      next: () => {
        this.feedback.success('SHARE', `Share revoked for ${share.path}`);
        this.revokingId.set(null);
        this.loadShares();
      },
      error: () => {
        this.revokingId.set(null);
      },
    });
  }

  isExpired(expiresAt: string): boolean {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  }
}
