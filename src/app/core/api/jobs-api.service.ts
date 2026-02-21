import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiMeta, ApiResponse, JobData, JobItemsData, JobUpdate } from '../models/api.models';
import { API_BASE_URL } from '../http/api-base-url.token';
import { ConflictPolicy } from './operations-api.service';

export interface CreateJobPayload {
  operation: 'copy' | 'move' | 'delete';
  sources?: string[];
  destination?: string;
  paths?: string[];
  conflict_policy?: ConflictPolicy;
}

@Injectable({ providedIn: 'root' })
export class JobsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);

  createOperation(payload: CreateJobPayload): Observable<JobData> {
    return this.http
      .post<ApiResponse<JobData>>('/api/v1/jobs/operations', payload)
      .pipe(map((response) => response.data as JobData));
  }

  getJob(jobId: string): Observable<JobData> {
    return this.http
      .get<ApiResponse<JobData>>(`/api/v1/jobs/${encodeURIComponent(jobId)}`)
      .pipe(map((response) => response.data as JobData));
  }

  getJobItems(jobId: string, page = 1, limit = 100): Observable<{ data: JobItemsData; meta?: ApiMeta }> {
    const params = new HttpParams().set('page', page).set('limit', limit);
    return this.http
      .get<ApiResponse<JobItemsData>>(`/api/v1/jobs/${encodeURIComponent(jobId)}/items`, { params })
      .pipe(map((response) => ({ data: response.data as JobItemsData, meta: response.meta })));
  }

  streamProgress(jobId: string): Observable<JobUpdate> {
    return new Observable<JobUpdate>((subscriber) => {
      const url = `${this.baseUrl}/api/v1/jobs/${encodeURIComponent(jobId)}/stream`;
      const eventSource = new EventSource(url);

      eventSource.onmessage = (event) => {
        try {
          const update: JobUpdate = JSON.parse(event.data);
          subscriber.next(update);

          const status = update.status.toLowerCase();
          if (status === 'completed' || status === 'failed' || status === 'partial') {
            eventSource.close();
            subscriber.complete();
          }
        } catch {
          // Ignore parse errors
        }
      };

      eventSource.onerror = () => {
        eventSource.close();
        subscriber.complete();
      };

      return () => {
        eventSource.close();
      };
    });
  }
}
