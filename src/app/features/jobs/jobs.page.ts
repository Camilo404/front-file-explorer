import { DatePipe, TitleCasePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, startWith, Subscription, switchMap } from 'rxjs';

import { JobsApiService } from '../../core/api/jobs-api.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { JobData, JobItemResult, JobUpdate } from '../../core/models/api.models';
import { RecentJobsService } from './services/recent-jobs.service';

@Component({
  selector: 'app-jobs-page',
  imports: [ReactiveFormsModule, DatePipe, TitleCasePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <header class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 class="text-2xl font-bold tracking-tight text-zinc-100">Jobs & Operations</h1>
          <p class="text-sm text-zinc-400">Manage background tasks and file operations</p>
        </div>
      </header>

      <div class="grid gap-6 lg:grid-cols-3">
        <!-- Left Column: Forms -->
        <div class="space-y-6 lg:col-span-2">
          
          <!-- Create Job Card -->
          <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
            <h2 class="mb-4 text-lg font-semibold text-zinc-200 flex items-center gap-2">
              <i class="fa-solid fa-plus-circle text-violet-400"></i>
              New Operation
            </h2>
            
            <form class="grid gap-4" [formGroup]="createForm" (ngSubmit)="createJob()">
              <div class="grid gap-4 sm:grid-cols-2">
                <div class="space-y-1.5">
                  <label class="text-xs font-medium text-zinc-400 ml-1">Operation Type</label>
                  <select formControlName="operation" class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" (change)="onOperationChange()">
                    <option value="copy">Copy</option>
                    <option value="move">Move</option>
                    <option value="delete">Delete</option>
                  </select>
                </div>

                <div class="space-y-1.5">
                   <label class="text-xs font-medium text-zinc-400 ml-1">Conflict Policy</label>
                   <select
                    formControlName="conflictPolicy"
                    [attr.disabled]="isDeleteOperation() ? true : null"
                    class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
                  >
                    <option value="rename">Rename (Keep Both)</option>
                    <option value="overwrite">Overwrite</option>
                    <option value="skip">Skip</option>
                  </select>
                </div>
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-400 ml-1">
                  {{ isDeleteOperation() ? 'Paths to Delete' : 'Source Paths' }}
                  <span class="text-zinc-500 font-normal">(comma separated)</span>
                </label>
                <input
                  type="text"
                  formControlName="sources"
                  [placeholder]="isDeleteOperation() ? '/path/to/file1, /path/to/dir2' : '/source/path1, /source/path2'"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
                />
              </div>

              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-400 ml-1">Destination Path</label>
                <input
                  type="text"
                  formControlName="destination"
                  [attr.disabled]="isDeleteOperation() ? true : null"
                  [placeholder]="isDeleteOperation() ? 'Not required for delete operations' : '/target/destination/folder'"
                  class="w-full rounded-xl border border-white/10 bg-black/20 px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50 disabled:opacity-50"
                />
              </div>

              <div class="pt-2 flex justify-end">
                <button 
                  type="submit" 
                  class="rounded-xl bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 ring-1 ring-violet-500/50 disabled:opacity-50 disabled:pointer-events-none"
                  [disabled]="createForm.invalid || creating()"
                >
                  @if (creating()) {
                    <i class="fa-solid fa-circle-notch fa-spin mr-2"></i>
                  } @else {
                    <i class="fa-solid fa-play mr-2"></i>
                  }
                  Start Job
                </button>
              </div>
            </form>
          </section>

          <!-- Job Details Section -->
          @if (job(); as currentJob) {
            <article class="rounded-2xl border border-white/5 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
              <!-- Header -->
              <div class="bg-white/5 px-5 py-4 border-b border-white/5 flex items-center justify-between">
                <div class="flex items-center gap-3">
                  <div class="h-10 w-10 rounded-lg flex items-center justify-center bg-black/20 border border-white/10">
                    <i class="fa-solid text-lg" 
                      [class.fa-copy]="currentJob.operation === 'copy'"
                      [class.fa-arrows-up-down-left-right]="currentJob.operation === 'move'"
                      [class.fa-trash]="currentJob.operation === 'delete'"
                      [class.text-blue-400]="currentJob.operation === 'copy'"
                      [class.text-amber-400]="currentJob.operation === 'move'"
                      [class.text-red-400]="currentJob.operation === 'delete'"
                    ></i>
                  </div>
                  <div>
                    <h3 class="font-bold text-zinc-100 text-sm">Job Details</h3>
                    <p class="text-xs text-zinc-400 font-mono">{{ currentJob.job_id }}</p>
                  </div>
                </div>
                
                <div class="flex items-center gap-2">
                  <span class="px-2.5 py-1 rounded-full text-xs font-medium border"
                    [class.bg-emerald-500/10]="currentJob.status === 'completed'"
                    [class.text-emerald-400]="currentJob.status === 'completed'"
                    [class.border-emerald-500/20]="currentJob.status === 'completed'"
                    [class.bg-blue-500/10]="currentJob.status === 'running'"
                    [class.text-blue-400]="currentJob.status === 'running'"
                    [class.border-blue-500/20]="currentJob.status === 'running'"
                    [class.bg-red-500/10]="currentJob.status === 'failed'"
                    [class.text-red-400]="currentJob.status === 'failed'"
                    [class.border-red-500/20]="currentJob.status === 'failed'"
                    [class.bg-zinc-500/10]="currentJob.status === 'queued'"
                    [class.text-zinc-400]="currentJob.status === 'queued'"
                    [class.border-zinc-500/20]="currentJob.status === 'queued'"
                  >
                    {{ currentJob.status | titlecase }}
                  </span>
                </div>
              </div>

              <div class="p-5 space-y-6">
                <!-- Progress -->
                <div class="space-y-2">
                  <div class="flex justify-between text-xs text-zinc-400">
                    <span>Progress</span>
                    <span>{{ currentJob.progress }}%</span>
                  </div>
                  <div class="h-2.5 w-full overflow-hidden rounded-full bg-zinc-800 ring-1 ring-white/5">
                    <div
                      class="h-full rounded-full transition-all duration-500 ease-out relative overflow-hidden"
                      [class.bg-emerald-500]="currentJob.status === 'completed'"
                      [class.bg-blue-500]="currentJob.status === 'running' || currentJob.status === 'queued'"
                      [class.bg-red-500]="currentJob.status === 'failed'"
                      [style.width.%]="currentJob.progress"
                    >
                      @if (currentJob.status === 'running') {
                        <div class="absolute inset-0 bg-white/20 animate-pulse"></div>
                      }
                    </div>
                  </div>
                </div>

                <!-- Stats Grid -->
                <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div class="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p class="text-xs text-zinc-500 mb-1">Total Items</p>
                    <p class="text-lg font-bold text-zinc-200">{{ currentJob.total_items }}</p>
                  </div>
                  <div class="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p class="text-xs text-zinc-500 mb-1">Processed</p>
                    <p class="text-lg font-bold text-zinc-200">{{ currentJob.processed_items }}</p>
                  </div>
                  <div class="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p class="text-xs text-zinc-500 mb-1">Success</p>
                    <p class="text-lg font-bold text-emerald-400">{{ currentJob.success_items }}</p>
                  </div>
                  <div class="bg-black/20 rounded-xl p-3 border border-white/5">
                    <p class="text-xs text-zinc-500 mb-1">Failed</p>
                    <p class="text-lg font-bold text-red-400">{{ currentJob.failed_items }}</p>
                  </div>
                </div>

                <!-- Actions -->
                <div class="flex items-center gap-3 pt-2">
                  <button
                    type="button"
                    class="flex-1 sm:flex-none rounded-xl px-4 py-2 text-sm font-medium transition-all flex items-center justify-center gap-2 border"
                    [class.bg-emerald-600]="!streaming()"
                    [class.hover:bg-emerald-500]="!streaming()"
                    [class.text-white]="!streaming()"
                    [class.border-transparent]="!streaming()"
                    [class.bg-red-500/10]="streaming()"
                    [class.text-red-400]="streaming()"
                    [class.border-red-500/20]="streaming()"
                    [class.hover:bg-red-500/20]="streaming()"
                    (click)="toggleStream()"
                  >
                    <i class="fa-solid text-xs" [class.fa-satellite-dish]="!streaming()" [class.fa-stop]="streaming()"></i>
                    {{ streaming() ? 'Stop Live Stream' : 'Live Updates' }}
                  </button>
                  
                  @if (streaming()) {
                    <span class="flex items-center gap-2 text-xs text-emerald-400 animate-pulse ml-2">
                      <span class="h-2 w-2 rounded-full bg-emerald-400"></span>
                      Streaming...
                    </span>
                  }
                </div>
              </div>
            </article>
          }

          <!-- Job Items List -->
          @if (items().length > 0) {
            <section class="rounded-2xl border border-white/5 bg-zinc-900/40 overflow-hidden shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
              <div class="bg-white/5 px-5 py-3 border-b border-white/5">
                <h3 class="font-semibold text-zinc-200 text-sm">Processed Items</h3>
              </div>
              
              <div class="max-h-[400px] overflow-y-auto p-2 space-y-1">
                @for (item of items(); track $index) {
                  <div class="group flex items-start gap-3 rounded-lg p-2 hover:bg-white/5 transition-colors text-xs">
                    <div class="mt-0.5">
                      @if (item.status === 'success') {
                        <i class="fa-solid fa-check-circle text-emerald-400"></i>
                      } @else if (item.status === 'failed') {
                        <i class="fa-solid fa-circle-xmark text-red-400"></i>
                      } @else {
                        <i class="fa-solid fa-circle-minus text-zinc-500"></i>
                      }
                    </div>
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 text-zinc-300 break-all font-mono">
                        <span>{{ item.path || item.from }}</span>
                        @if (item.to) {
                          <i class="fa-solid fa-arrow-right text-zinc-600 text-[10px]"></i>
                          <span>{{ item.to }}</span>
                        }
                      </div>
                      @if (item.reason) {
                        <p class="text-red-400/80 mt-1 pl-2 border-l-2 border-red-500/20">{{ item.reason }}</p>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="bg-white/5 px-4 py-3 border-t border-white/5 flex items-center justify-between text-xs">
                <span class="text-zinc-500">Page {{ itemsPage() }} of {{ itemsTotalPages() }} • {{ itemsTotal() }} items</span>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="rounded-lg bg-black/20 border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                    [disabled]="itemsPage() <= 1"
                    (click)="changeItemsPage(-1)"
                  >
                    Previous
                  </button>
                  <button
                    type="button"
                    class="rounded-lg bg-black/20 border border-white/10 px-3 py-1.5 text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30 transition-colors"
                    [disabled]="itemsPage() >= itemsTotalPages()"
                    (click)="changeItemsPage(1)"
                  >
                    Next
                  </button>
                </div>
              </div>
            </section>
          }
        </div>

        <!-- Right Column: Recent Jobs & Lookup -->
        <div class="space-y-6">
          <!-- Quick Lookup -->
          <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
             <h3 class="mb-3 text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <i class="fa-solid fa-magnifying-glass text-zinc-500"></i>
              Find Job
            </h3>
            <form class="flex gap-2" [formGroup]="lookupForm" (ngSubmit)="onLookupSubmit()">
              <input 
                type="text" 
                formControlName="jobId" 
                placeholder="Paste Job ID..." 
                class="flex-1 rounded-xl border border-white/10 bg-black/20 px-3 py-2 text-xs text-zinc-200 focus:border-violet-500/50 focus:outline-none focus:ring-1 focus:ring-violet-500/50" 
              />
              <button type="submit" class="rounded-xl bg-zinc-800 px-3 py-2 text-xs font-medium text-zinc-300 hover:bg-zinc-700 hover:text-white border border-white/5 transition-colors">
                Search
              </button>
            </form>
          </section>

          <!-- Recent Jobs History -->
          <section class="rounded-2xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5 overflow-hidden flex flex-col h-[500px]">
            <div class="bg-white/5 px-5 py-3 border-b border-white/5 flex items-center justify-between">
              <h3 class="font-semibold text-zinc-200 text-sm flex items-center gap-2">
                <i class="fa-solid fa-clock-rotate-left text-zinc-400"></i>
                Recent History
              </h3>
              @if (recentJobsService.recentJobs().length > 0) {
                <button 
                  (click)="clearHistory()" 
                  class="text-[10px] uppercase font-bold tracking-wider text-zinc-500 hover:text-red-400 transition-colors"
                >
                  Clear
                </button>
              }
            </div>

            <div class="flex-1 overflow-y-auto p-2 space-y-1">
              @if (recentJobsService.recentJobs().length === 0) {
                <div class="h-full flex flex-col items-center justify-center text-zinc-600 p-6 text-center">
                  <i class="fa-solid fa-ghost text-2xl mb-2 opacity-50"></i>
                  <p class="text-xs">No recent jobs found</p>
                </div>
              }

              @for (job of recentJobsService.recentJobs(); track job.id) {
                <button
                  type="button"
                  class="w-full text-left group flex items-center gap-3 rounded-xl p-3 hover:bg-white/5 transition-all border border-transparent hover:border-white/5"
                  [class.bg-white/5]="job.id === this.job()?.job_id"
                  [class.border-violet-500/20]="job.id === this.job()?.job_id"
                  (click)="loadJob(job.id)"
                >
                  <div class="h-8 w-8 rounded-lg flex items-center justify-center bg-black/20 text-xs border border-white/10 shrink-0">
                    <i class="fa-solid" 
                      [class.fa-copy]="job.operation === 'copy'"
                      [class.fa-arrows-up-down-left-right]="job.operation === 'move'"
                      [class.fa-trash]="job.operation === 'delete'"
                      [class.text-blue-400]="job.operation === 'copy'"
                      [class.text-amber-400]="job.operation === 'move'"
                      [class.text-red-400]="job.operation === 'delete'"
                    ></i>
                  </div>
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-zinc-300 truncate group-hover:text-white transition-colors">
                      {{ job.operation | titlecase }} Operation
                    </p>
                    <p class="text-[10px] text-zinc-500 truncate font-mono mt-0.5">
                      {{ job.id.substring(0, 8) }}...
                    </p>
                  </div>
                  <div class="text-[10px] text-zinc-600 shrink-0">
                    {{ job.timestamp | date:'shortTime' }}
                  </div>
                </button>
              }
            </div>
          </section>
        </div>
      </div>
    </section>
  `,
})
export class JobsPage {
  private readonly fb = inject(FormBuilder);
  private readonly jobsApi = inject(JobsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly feedback = inject(ErrorStoreService);
  readonly recentJobsService = inject(RecentJobsService);

  private pollSub: Subscription | null = null;
  private streamSub: Subscription | null = null;

  readonly job = signal<JobData | null>(null);
  readonly items = signal<JobItemResult[]>([]);
  readonly itemsPage = signal(1);
  readonly itemsLimit = signal(50);
  readonly itemsTotalPages = signal(1);
  readonly itemsTotal = signal(0);
  readonly streaming = signal(false);
  readonly creating = signal(false);

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

    this.creating.set(true);
    this.jobsApi.createOperation(payload).subscribe({
      next: (job) => {
        this.creating.set(false);
        this.feedback.success('JOB_CREATED', `Job started: ${job.job_id}`);
        
        // Add to history
        this.recentJobsService.addJob(job.job_id, job.operation);
        
        // Load it immediately
        this.lookupForm.patchValue({ jobId: job.job_id });
        this.loadJob(job.job_id);
      },
      error: () => {
        this.creating.set(false);
      },
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

  onLookupSubmit(): void {
    const jobId = this.lookupForm.getRawValue().jobId.trim();
    if (jobId) {
      this.loadJob(jobId);
    }
  }

  loadJob(jobId: string): void {
    // Stop any existing polling/streaming
    this.stopPolling();
    this.stopStreaming();
    
    // Reset view state
    this.itemsPage.set(1);
    this.job.set(null); // Clear current job to show loading state if desired, or keep it until new one loads
    
    // Update lookup form if called from history list
    if (this.lookupForm.getRawValue().jobId !== jobId) {
      this.lookupForm.patchValue({ jobId });
    }

    // Start polling logic
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

          // Add to history if not already there (e.g. from manual lookup)
          this.recentJobsService.addJob(job.job_id, job.operation);

          if (this.isTerminalJobStatus(job.status)) {
            // If finished, stop polling
            this.stopPolling();
          }
        },
        error: (err) => {
          // If 404, maybe remove from history?
          this.stopPolling();
        },
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

  clearHistory(): void {
    if (confirm('Clear recent jobs history?')) {
      this.recentJobsService.clear();
    }
  }

  private loadJobItems(): void {
    const currentJob = this.job();
    if (!currentJob) {
      return;
    }

    this.jobsApi.getJobItems(currentJob.job_id, this.itemsPage(), this.itemsLimit()).subscribe({
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
      // Resume polling if job not finished? Or just stop everything?
      // Usually if user stops stream, they might want to go back to polling or manual refresh.
      // Let's restart polling if job is not terminal.
      const currentJob = this.job();
      if (currentJob && !this.isTerminalJobStatus(currentJob.status)) {
        this.loadJob(currentJob.job_id);
      }
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
              ? { ...j, status: update.status, progress: update.progress, processed_items: update.processed_items, total_items: update.total_items, success_items: update.success_items, failed_items: update.failed_items }
              : j
          );

          if (this.isTerminalJobStatus(update.status)) {
            this.feedback.info('JOB_STREAM', `Job finished: ${update.status}`);
            this.stopStreaming();
            this.loadJobItems();
          }
        },
        error: () => {
          this.stopStreaming();
          // Fallback to polling on error
          this.loadJob(currentJob.job_id);
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
