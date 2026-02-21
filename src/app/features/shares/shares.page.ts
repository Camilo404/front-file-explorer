import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { SharesApiService } from '../../core/api/shares-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { ShareRecord } from '../../core/models/api.models';
import { API_BASE_URL } from '../../core/http/api-base-url.token';

@Component({
  selector: 'app-shares-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <header class="flex items-center justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Shares</h1>
        <button
          type="button"
          class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-40"
          [disabled]="loading()"
          (click)="loadShares()"
        >
          Refresh
        </button>
      </header>

      <!-- Create share form -->
      <form
        class="grid gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 md:grid-cols-4"
        [formGroup]="createForm"
        (ngSubmit)="createShare()"
      >
        <input
          type="text"
          formControlName="path"
          placeholder="File path to share (e.g. /docs/readme.md)"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 md:col-span-2"
        />
        <input
          type="text"
          formControlName="expiresIn"
          placeholder="Expires in (e.g. 24h, 7d) — optional"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <button
          type="submit"
          class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 ring-1 ring-violet-500/50 disabled:opacity-50"
          [disabled]="createForm.invalid || creating()"
        >
          {{ creating() ? 'Creating...' : 'Create Share' }}
        </button>
      </form>

      <!-- Shares list -->
      <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading()) {
          <p class="text-sm text-zinc-400">Loading shares...</p>
        } @else if (shares().length === 0) {
          <p class="text-sm text-zinc-400">No active shares.</p>
        } @else {
          <div class="overflow-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-zinc-800">
                  <th class="px-2 py-1">Path</th>
                  <th class="px-2 py-1">Created By</th>
                  <th class="px-2 py-1">Created At</th>
                  <th class="px-2 py-1">Expires At</th>
                  <th class="px-2 py-1">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (share of shares(); track share.id) {
                  <tr class="border-b border-zinc-800/50">
                    <td class="px-2 py-1 font-mono text-[11px]">{{ share.path }}</td>
                    <td class="px-2 py-1">{{ share.created_by }}</td>
                    <td class="px-2 py-1">{{ share.created_at }}</td>
                    <td class="px-2 py-1">{{ share.expires_at || 'Never' }}</td>
                    <td class="px-2 py-1">
                      <div class="flex items-center gap-1">
                        <button
                          type="button"
                          class="rounded bg-violet-700 px-2 py-1 text-white hover:bg-violet-600"
                          title="Copy public link"
                          (click)="copyLink(share)"
                        >
                          <i class="fa-solid fa-link text-[10px]"></i> Copy
                        </button>
                        <button
                          type="button"
                          class="rounded bg-red-700 px-2 py-1 text-white hover:bg-red-600 disabled:opacity-50"
                          [disabled]="revokingId() === share.id"
                          (click)="revokeShare(share)"
                        >
                          {{ revokingId() === share.id ? '...' : 'Revoke' }}
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
    const url = `${this.apiBaseUrl}${this.sharesApi.getPublicDownloadUrl(share.token)}`;
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
}
