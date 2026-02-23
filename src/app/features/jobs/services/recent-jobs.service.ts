import { Injectable, signal, inject, OnDestroy } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { WebSocketService } from '../../../core/websocket/websocket.service';
import { WSEventType, WSJobPayload } from '../../../core/websocket/websocket.models';
import { ErrorStoreService } from '../../../core/errors/error-store.service';

export interface RecentJob {
  id: string;
  operation: string;
  timestamp: number;
  status?: 'queued' | 'running' | 'completed' | 'failed' | 'partial';
  progress?: number;
  totalItems?: number;
  processedItems?: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentJobsService {
  private readonly STORAGE_KEY = 'file_explorer_recent_jobs';
  readonly recentJobs = signal<RecentJob[]>(this.loadJobs());
  
  private readonly wsService = inject(WebSocketService);
  private readonly errorStore = inject(ErrorStoreService);

  constructor() {
    this.wsService.onTypes<WSJobPayload>([
      WSEventType.JobStarted,
      WSEventType.JobProgress,
      WSEventType.JobCompleted,
      WSEventType.JobFailed
    ]).pipe(
      takeUntilDestroyed()
    ).subscribe(event => {
      this.updateJob(event.payload);
      
      if (event.type === WSEventType.JobCompleted) {
        this.errorStore.success('Tarea completada', `La operación ${event.payload.operation || 'job'} finalizó correctamente.`);
      } else if (event.type === WSEventType.JobFailed) {
        this.errorStore.error('Tarea fallida', `La operación ${event.payload.operation || 'job'} falló.`);
      }
    });
  }

  addJob(id: string, operation: string) {
    const current = this.recentJobs();
    // Remove if exists to move to top
    const filtered = current.filter(j => j.id !== id);
    const newJob: RecentJob = { id, operation, timestamp: Date.now() };
    const updated = [newJob, ...filtered].slice(0, 10); // Keep last 10
    
    this.recentJobs.set(updated);
    this.saveJobs(updated);
  }

  removeJob(id: string) {
    const updated = this.recentJobs().filter(j => j.id !== id);
    this.recentJobs.set(updated);
    this.saveJobs(updated);
  }
  
  clear() {
    this.recentJobs.set([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  private updateJob(payload: WSJobPayload) {
    const current = this.recentJobs();
    const index = current.findIndex(j => j.id === payload.job_id);
    
    if (index !== -1) {
      const updatedJobs = [...current];
      updatedJobs[index] = {
        ...updatedJobs[index],
        status: payload.status,
        progress: payload.progress,
        totalItems: payload.total_items,
        processedItems: payload.processed_items
      };
      this.recentJobs.set(updatedJobs);
      this.saveJobs(updatedJobs);
    }
  }

  private loadJobs(): RecentJob[] {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch {
      return [];
    }
  }

  private saveJobs(jobs: RecentJob[]) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(jobs));
  }
}
