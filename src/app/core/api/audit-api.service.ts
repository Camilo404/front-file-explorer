import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiMeta, ApiResponse, AuditListData } from '../models/api.models';

export interface AuditQuery {
  action?: string;
  actor_id?: string;
  status?: string;
  path?: string;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class AuditApiService {
  private readonly http = inject(HttpClient);

  list(query: AuditQuery): Observable<{ data: AuditListData; meta?: ApiMeta }> {
    let params = new HttpParams();
    if (query.action) params = params.set('action', query.action);
    if (query.actor_id) params = params.set('actor_id', query.actor_id);
    if (query.status) params = params.set('status', query.status);
    if (query.path) params = params.set('path', query.path);
    if (query.from) params = params.set('from', query.from);
    if (query.to) params = params.set('to', query.to);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);

    return this.http
      .get<ApiResponse<AuditListData>>('/api/v1/audit', { params })
      .pipe(map((response) => ({ data: response.data as AuditListData, meta: response.meta })));
  }
}
