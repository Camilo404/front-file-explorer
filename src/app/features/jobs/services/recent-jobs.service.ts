import { Injectable, signal } from '@angular/core';

export interface RecentJob {
  id: string;
  operation: string;
  timestamp: number;
}

@Injectable({
  providedIn: 'root'
})
export class RecentJobsService {
  private readonly STORAGE_KEY = 'file_explorer_recent_jobs';
  readonly recentJobs = signal<RecentJob[]>(this.loadJobs());

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
