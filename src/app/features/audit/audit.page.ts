import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { AuditApiService } from '../../core/api/audit-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { AuditEntry } from '../../core/models/api.models';

@Component({
  selector: 'app-audit-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <h1 class="text-lg font-semibold">Audit (Admin)</h1>

      <form class="grid gap-2 rounded border border-slate-800 bg-slate-900 p-3 md:grid-cols-6" [formGroup]="form" (ngSubmit)="applyFilters()">
        <input formControlName="action" type="text" placeholder="action" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
        <input formControlName="actor_id" type="text" placeholder="actor_id" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
        <input formControlName="status" type="text" placeholder="status" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
        <input formControlName="path" type="text" placeholder="path" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
        <input formControlName="from" type="text" placeholder="from (ISO)" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" />
        <button type="submit" class="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">Filtrar</button>
      </form>

      <section class="rounded border border-slate-800 bg-slate-900 p-3">
        <div class="mb-2 flex items-center justify-between text-xs">
          <span class="text-slate-400">{{ entries().length }} registros | Página {{ page() }}/{{ totalPages() }} | Total {{ totalItems() }}</span>
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
        <div class="overflow-auto">
          <table class="w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800">
                <th class="px-2 py-1">Time</th>
                <th class="px-2 py-1">Action</th>
                <th class="px-2 py-1">User</th>
                <th class="px-2 py-1">Status</th>
                <th class="px-2 py-1">Resource</th>
              </tr>
            </thead>
            <tbody>
              @for (entry of entries(); track $index) {
                <tr class="border-b border-slate-800/50">
                  <td class="px-2 py-1">{{ entry.occurred_at }}</td>
                  <td class="px-2 py-1">{{ entry.action }}</td>
                  <td class="px-2 py-1">{{ entry.actor.username || entry.actor.user_id }}</td>
                  <td class="px-2 py-1">{{ entry.status }}</td>
                  <td class="px-2 py-1">{{ entry.resource }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </section>
    </section>
  `,
})
export class AuditPage {
  private readonly fb = inject(FormBuilder);
  private readonly auditApi = inject(AuditApiService);
  private readonly feedback = inject(ErrorStoreService);

  readonly entries = signal<AuditEntry[]>([]);
  readonly page = signal(1);
  readonly limit = signal(50);
  readonly totalPages = signal(1);
  readonly totalItems = signal(0);

  readonly form = this.fb.nonNullable.group({
    action: '',
    actor_id: '',
    status: '',
    path: '',
    from: '',
    to: '',
  });

  constructor() {
    this.load();
  }

  applyFilters(): void {
    this.page.set(1);
    this.load();
  }

  changePage(offset: number): void {
    const nextPage = this.page() + offset;
    if (nextPage < 1 || nextPage > this.totalPages()) {
      return;
    }

    this.page.set(nextPage);
    this.load();
  }

  load(): void {
    const value = this.form.getRawValue();
    this.auditApi.list({ ...value, page: this.page(), limit: this.limit() }).subscribe({
      next: (result) => {
        this.entries.set(result.data.items);
        this.totalPages.set(result.meta?.total_pages ?? 1);
        this.totalItems.set(result.meta?.total ?? result.data.items.length);
      },
      error: () => {},
    });
  }
}
