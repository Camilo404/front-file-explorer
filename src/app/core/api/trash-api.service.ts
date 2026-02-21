import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, TrashListData } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class TrashApiService {
  private readonly http = inject(HttpClient);

  list(includeRestored = false): Observable<TrashListData> {
    let params = new HttpParams();
    if (includeRestored) {
      params = params.set('include_restored', 'true');
    }

    return this.http
      .get<ApiResponse<TrashListData>>('/api/v1/trash', { params })
      .pipe(map((response) => response.data as TrashListData));
  }

  permanentDelete(trashId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`/api/v1/trash/${encodeURIComponent(trashId)}`)
      .pipe(map((response) => Boolean(response.data?.deleted)));
  }

  emptyTrash(): Observable<number> {
    return this.http
      .delete<ApiResponse<{ deleted_count: number }>>('/api/v1/trash')
      .pipe(map((response) => response.data?.deleted_count ?? 0));
  }
}
