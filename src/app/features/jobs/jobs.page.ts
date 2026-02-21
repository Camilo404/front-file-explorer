import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { interval, startWith, Subscription, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { JobsApiService } from '../../core/api/jobs-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { JobData, JobItemResult, JobUpdate } from '../../core/models/api.models';

@Component({
  selector: 'app-jobs-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Jobs</h1>

      <form class="grid gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 md:grid-cols-5" [formGroup]="createForm" (ngSubmit)="createJob()">
        <select formControlName="operation" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50" (change)="onOperationChange()">
          <option value="copy">copy</option>
          <option value="move">move</option>
          <option value="delete">delete</option>
        </select>
        <input
          type="text"
          formControlName="sources"
          [placeholder]="isDeleteOperation() ? 'paths (comma separated)' : 'sources (comma separated)'"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 md:col-span-2"
        />
        <input
          type="text"
          formControlName="destination"
          [disabled]="isDeleteOperation()"
          [placeholder]="isDeleteOperation() ? 'not required for delete' : 'destination'"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        />
        <select
          formControlName="conflictPolicy"
          [disabled]="isDeleteOperation()"
          class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
        >
          <option value="rename">rename</option>
          <option value="overwrite">overwrite</option>
          <option value="skip">skip</option>
        </select>
        <button type="submit" class="rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 ring-1 ring-violet-500/50">Create Job</button>
      </form>

      <form class="grid gap-2 rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 md:grid-cols-4" [formGroup]="lookupForm" (ngSubmit)="lookupJob()">
        <input type="text" formControlName="jobId" placeholder="job_id" class="rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50 md:col-span-3" />
        <button type="submit" class="rounded bg-zinc-700 px-3 py-2 text-sm hover:bg-zinc-600">Consultar</button>
      </form>

      @if (job()) {
        <article class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 text-sm space-y-3">
          <div class="grid gap-1">
            <p><strong>ID:</strong> {{ job()!.job_id }}</p>
            <p><strong>Status:</strong> {{ job()!.status }}</p>
            <p><strong>Operation:</strong> {{ job()!.operation }}</p>
            <p><strong>Progress:</strong> {{ job()!.progress }}%</p>
            <p><strong>Processed:</strong> {{ job()!.processed_items }}/{{ job()!.total_items }}</p>
          </div>

          <!-- Progress bar -->
          <div class="h-2 w-full overflow-hidden rounded-full bg-zinc-800">
            <div
              class="h-full rounded-full bg-violet-500 transition-all duration-300"
              [style.width.%]="job()!.progress"
            ></div>
          </div>

          <!-- SSE stream button -->
          <div class="flex items-center gap-3">
            <button
              type="button"
              class="rounded-xl px-4 py-2 text-sm font-medium transition-all"
              [class.bg-emerald-600]="!streaming()"
              [class.hover:bg-emerald-500]="!streaming()"
              [class.text-white]="!streaming()"
              [class.bg-red-600]="streaming()"
              [class.hover:bg-red-500]="streaming()"
              [class.text-white]="streaming()"
              (click)="toggleStream()"
            >
              <i class="fa-solid mr-1.5 text-xs" [class.fa-satellite-dish]="!streaming()" [class.fa-stop]="streaming()"></i>
              {{ streaming() ? 'Stop Stream' : 'Live Stream' }}
            </button>
            @if (streaming()) {
              <span class="flex items-center gap-1.5 text-xs text-emerald-400">
                <span class="inline-block h-2 w-2 animate-pulse rounded-full bg-emerald-400"></span>
                Streaming live updates...
              </span>
            }
          </div>
        </article>
      }

      @if (items().length > 0) {
        <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
          <h2 class="mb-2 text-sm font-semibold">Items</h2>
          <ul class="space-y-1 text-xs">
            @for (item of items(); track $index) {
              <li class="rounded bg-zinc-950 px-2 py-1">
                {{ item.status }} - {{ item.path || item.from }} {{ item.to ? '→ ' + item.to : '' }}
                @if (item.reason) {
                  <span class="text-red-300">({{ item.reason }})</span>
                }
              </li>
            }
          </ul>

          <div class="mt-3 flex items-center justify-between text-xs">
            <span class="text-zinc-400">Página {{ itemsPage() }}/{{ itemsTotalPages() }} | Total {{ itemsTotal() }}</span>
            <div class="flex gap-2">
              <button
                type="button"
                class="rounded bg-zinc-700 px-2 py-1 hover:bg-zinc-600"
                [disabled]="itemsPage() <= 1"
                (click)="changeItemsPage(-1)"
              >
                Prev
              </button>
              <button
                type="button"
                class="rounded bg-zinc-700 px-2 py-1 hover:bg-zinc-600"
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
  private streamSub: Subscription | null = null;

  readonly job = signal<JobData | null>(null);
  readonly items = signal<JobItemResult[]>([]);
  readonly itemsPage = signal(1);
  readonly itemsLimit = signal(50);
  readonly itemsTotalPages = signal(1);
  readonly itemsTotal = signal(0);
  readonly streaming = signal(false);

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

  toggleStream(): void {
    if (this.streaming()) {
      this.stopStreaming();
      return;
    }

    const currentJob = this.job();
    if (!currentJob) {
      return;
    }

    this.stopPolling();
    this.streaming.set(true);

    this.streamSub = this.jobsApi.streamProgress(currentJob.job_id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (update: JobUpdate) => {
          this.job.update((j) =>
            j
              ? { ...j, status: update.status, progress: update.progress, processed_items: update.processed_items, total_items: update.total_items }
              : j
          );

          if (this.isTerminalJobStatus(update.status)) {
            this.feedback.info('JOB_STREAM', `Job ${update.job_id} finished: ${update.status}`);
            this.stopStreaming();
            this.loadJobItems();
          }
        },
        error: () => {
          this.stopStreaming();
        },
        complete: () => {
          this.stopStreaming();
          this.loadJobItems();
        },
      });
  }

  private stopStreaming(): void {
    this.streamSub?.unsubscribe();
    this.streamSub = null;
    this.streaming.set(false);
  }
}
