import { computed, Injectable, signal } from '@angular/core';

import { UploadEntry } from './upload.models';

@Injectable({ providedIn: 'root' })
export class UploadTrackerService {
  readonly entries = signal<UploadEntry[]>([]);

  readonly hasEntries = computed(() => this.entries().length > 0);

  readonly isUploading = computed(() =>
    this.entries().some((e) => e.status === 'pending' || e.status === 'uploading'),
  );

  readonly completedCount = computed(() => this.entries().filter((e) => e.status === 'done').length);

  readonly totalCount = computed(() => this.entries().length);

  readonly overallProgress = computed(() => {
    const all = this.entries();
    if (all.length === 0) {
      return 0;
    }

    const totalBytes = all.reduce((sum, e) => sum + e.total, 0);
    if (totalBytes === 0) {
      return 0;
    }

    const loadedBytes = all.reduce((sum, e) => sum + e.loaded, 0);
    return Math.round((loadedBytes / totalBytes) * 100);
  });

  /**
   * Registers a batch of files for upload tracking.
   * Returns the generated entry IDs in the same order as the input files.
   */
  startBatch(files: File[]): string[] {
    const ids: string[] = [];

    const newEntries: UploadEntry[] = files.map((file) => {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      ids.push(id);
      return {
        id,
        fileName: file.name,
        fileSize: file.size,
        loaded: 0,
        total: file.size,
        progress: 0,
        status: 'pending',
      };
    });

    this.entries.update((current) => [...current, ...newEntries]);
    return ids;
  }

  /**
   * Updates progress for an entire batch at once.
   * Distributes the aggregate loaded bytes proportionally across files.
   */
  updateBatchProgress(ids: string[], loadedBytes: number, totalBytes: number): void {
    if (totalBytes <= 0) {
      return;
    }

    const ratio = Math.min(loadedBytes / totalBytes, 1);

    this.entries.update((current) =>
      current.map((entry) => {
        if (!ids.includes(entry.id)) {
          return entry;
        }

        const entryLoaded = Math.round(entry.fileSize * ratio);
        return {
          ...entry,
          loaded: entryLoaded,
          total: entry.fileSize,
          progress: Math.round(ratio * 100),
          status: 'uploading' as const,
        };
      }),
    );
  }

  markDone(id: string): void {
    this.updateEntry(id, { status: 'done', progress: 100, loaded: 0 });
    this.entries.update((current) =>
      current.map((e) => (e.id === id ? { ...e, loaded: e.total } : e)),
    );
  }

  markBatchDone(ids: string[]): void {
    this.entries.update((current) =>
      current.map((entry) => {
        if (!ids.includes(entry.id)) {
          return entry;
        }
        return { ...entry, status: 'done' as const, progress: 100, loaded: entry.total };
      }),
    );
    this.scheduleAutoClear();
  }

  markError(id: string, reason?: string): void {
    this.updateEntry(id, { status: 'error', errorReason: reason });
    this.scheduleAutoClear();
  }

  markBatchError(ids: string[], reason?: string): void {
    this.entries.update((current) =>
      current.map((entry) => {
        if (!ids.includes(entry.id)) {
          return entry;
        }
        return { ...entry, status: 'error' as const, errorReason: reason };
      }),
    );
    this.scheduleAutoClear();
  }

  clearCompleted(): void {
    this.entries.update((current) => current.filter((e) => e.status !== 'done' && e.status !== 'error'));
  }

  clearAll(): void {
    this.entries.set([]);
  }

  private updateEntry(id: string, changes: Partial<UploadEntry>): void {
    this.entries.update((current) =>
      current.map((entry) => (entry.id === id ? { ...entry, ...changes } : entry)),
    );
  }

  private autoClearTimer: ReturnType<typeof setTimeout> | null = null;

  private scheduleAutoClear(): void {
    if (this.autoClearTimer) {
      clearTimeout(this.autoClearTimer);
    }

    this.autoClearTimer = setTimeout(() => {
      if (!this.isUploading()) {
        this.clearAll();
      }
      this.autoClearTimer = null;
    }, 8000);
  }
}
