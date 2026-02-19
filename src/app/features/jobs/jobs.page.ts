import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval, startWith, Subscription, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { JobsApiService } from '../../core/api/jobs-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { JobData, JobItemResult } from '../../core/models/api.models';

@Component({
  selector: 'app-jobs-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <h1 class="text-lg font-semibold">Jobs</h1>

      <form class="grid gap-2 rounded border border-slate-800 bg-slate-900 p-3 md:grid-cols-5" [formGroup]="createForm" (ngSubmit)="createJob()">
        <select formControlName="operation" class="rounded border border-slate-700 bg-slate-950 px-3 py-2" (change)="onOperationChange()">
          <option value="copy">copy</option>
          <option value="move">move</option>
          <option value="delete">delete</option>
        </select>
        <input
          type="text"
          formControlName="sources"
          [placeholder]="isDeleteOperation() ? 'paths (comma separated)' : 'sources (comma separated)'"
          class="rounded border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-2"
        />
        <input
          type="text"
          formControlName="destination"
          [disabled]="isDeleteOperation()"
          [placeholder]="isDeleteOperation() ? 'not required for delete' : 'destination'"
          class="rounded border border-slate-700 bg-slate-950 px-3 py-2"
        />
        <select
          formControlName="conflictPolicy"
          [disabled]="isDeleteOperation()"
          class="rounded border border-slate-700 bg-slate-950 px-3 py-2"
        >
          <option value="rename">rename</option>
          <option value="overwrite">overwrite</option>
          <option value="skip">skip</option>
        </select>
        <button type="submit" class="rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">Create Job</button>
      </form>

      <form class="grid gap-2 rounded border border-slate-800 bg-slate-900 p-3 md:grid-cols-4" [formGroup]="lookupForm" (ngSubmit)="lookupJob()">
        <input type="text" formControlName="jobId" placeholder="job_id" class="rounded border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-3" />
        <button type="submit" class="rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600">Consultar</button>
      </form>

      @if (job()) {
        <article class="rounded border border-slate-800 bg-slate-900 p-3 text-sm">
          <p><strong>ID:</strong> {{ job()!.job_id }}</p>
          <p><strong>Status:</strong> {{ job()!.status }}</p>
          <p><strong>Operation:</strong> {{ job()!.operation }}</p>
          <p><strong>Progress:</strong> {{ job()!.progress }}%</p>
          <p><strong>Processed:</strong> {{ job()!.processed_items }}/{{ job()!.total_items }}</p>
        </article>
      }

      @if (items().length > 0) {
        <section class="rounded border border-slate-800 bg-slate-900 p-3">
          <h2 class="mb-2 text-sm font-semibold">Items</h2>
          <ul class="space-y-1 text-xs">
            @for (item of items(); track $index) {
              <li class="rounded bg-slate-950 px-2 py-1">
                {{ item.status }} - {{ item.path || item.from }} {{ item.to ? '→ ' + item.to : '' }}
                @if (item.reason) {
                  <span class="text-red-300">({{ item.reason }})</span>
                }
              </li>
            }
          </ul>

          <div class="mt-3 flex items-center justify-between text-xs">
            <span class="text-slate-400">Página {{ itemsPage() }}/{{ itemsTotalPages() }} | Total {{ itemsTotal() }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
                [disabled]="itemsPage() <= 1"
                (click)="changeItemsPage(-1)"
              >
                Prev
              </button>
              <button
                type="button"
                class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
                [disabled]="itemsPage() >= itemsTotalPages()"
                (click)="changeItemsPage(1)"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      }
    </section>
  `,
})
export class JobsPage {
  private readonly fb = inject(FormBuilder);
  private readonly jobsApi = inject(JobsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(ErrorStoreService);
  private pollSub: Subscription | null = null;

  readonly job = signal<JobData | null>(null);
  readonly items = signal<JobItemResult[]>([]);
  readonly itemsPage = signal(1);
  readonly itemsLimit = signal(50);
  readonly itemsTotalPages = signal(1);
  readonly itemsTotal = signal(0);

  readonly createForm = this.fb.nonNullable.group({
    operation: this.fb.nonNullable.control<'copy' | 'move' | 'delete'>('copy', Validators.required),
    sources: ['', Validators.required],
    destination: '',
    conflictPolicy: this.fb.nonNullable.control<'rename' | 'overwrite' | 'skip'>('rename'),
  });

  readonly lookupForm = this.fb.nonNullable.group({
    jobId: ['', Validators.required],
  });

  createJob(): void {
    if (this.createForm.invalid) {
      return;
    }

    const formValue = this.createForm.getRawValue();
    const sources = formValue.sources
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0);

    const payload =
      formValue.operation === 'delete'
        ? { operation: 'delete' as const, paths: sources }
        : {
            operation: formValue.operation,
            sources,
            destination: formValue.destination,
            conflict_policy: formValue.conflictPolicy,
          };

    this.jobsApi.createOperation(payload).subscribe({
      next: (job) => {
        this.lookupForm.patchValue({ jobId: job.job_id });
        this.feedback.success('JOB_CREATED', `Job creado: ${job.job_id}`);
        this.lookupJob();
      },
      error: () => {},
    });
  }

  onOperationChange(): void {
    if (this.isDeleteOperation()) {
      this.createForm.controls.destination.setValue('');
    }
  }

  isDeleteOperation(): boolean {
    return this.createForm.controls.operation.value === 'delete';
  }

  lookupJob(): void {
    const jobId = this.lookupForm.getRawValue().jobId.trim();
    if (!jobId) {
      return;
    }

    this.stopPolling();
    this.itemsPage.set(1);

    this.pollSub = interval(2500)
      .pipe(
        startWith(0),
        takeUntilDestroyed(this.destroyRef),
        switchMap(() => this.jobsApi.getJob(jobId))
      )
      .subscribe({
        next: (job) => {
          this.job.set(job);
          this.loadJobItems();

          if (this.isTerminalJobStatus(job.status)) {
            this.feedback.info('JOB_STATUS', `Job ${job.job_id} finalizó con estado ${job.status}.`);
            this.stopPolling();
          }
        },
        error: () => {},
      });
  }

  changeItemsPage(offset: number): void {
    const nextPage = this.itemsPage() + offset;
    if (nextPage < 1 || nextPage > this.itemsTotalPages()) {
      return;
    }

    this.itemsPage.set(nextPage);
    this.loadJobItems();
  }

  private loadJobItems(): void {
    const jobId = this.lookupForm.getRawValue().jobId.trim();
    if (!jobId) {
      return;
    }

    this.jobsApi.getJobItems(jobId, this.itemsPage(), this.itemsLimit()).subscribe({
      next: (itemsResult) => {
        this.items.set(itemsResult.data.items);
        this.itemsTotalPages.set(itemsResult.meta?.total_pages ?? 1);
        this.itemsTotal.set(itemsResult.meta?.total ?? itemsResult.data.items.length);
      },
      error: () => {},
    });
  }

  private isTerminalJobStatus(status: string): boolean {
    const normalized = status.toLowerCase();
    return normalized === 'completed' || normalized === 'failed' || normalized === 'cancelled';
  }

  private stopPolling(): void {
    this.pollSub?.unsubscribe();
    this.pollSub = null;
  }
}
