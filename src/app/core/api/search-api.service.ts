import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiMeta, ApiResponse, SearchData } from '../models/api.models';

export interface SearchQuery {
  q: string;
  path?: string;
  type?: 'file' | 'dir';
  ext?: string;
  page?: number;
  limit?: number;
}

@Injectable({ providedIn: 'root' })
export class SearchApiService {
  private readonly http = inject(HttpClient);

  search(query: SearchQuery): Observable<{ data: SearchData; meta?: ApiMeta }> {
    let params = new HttpParams().set('q', query.q);
    if (query.path) params = params.set('path', query.path);
    if (query.type) params = params.set('type', query.type);
    if (query.ext) params = params.set('ext', query.ext);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);

    return this.http
      .get<ApiResponse<SearchData>>('/api/v1/search', { params })
      .pipe(map((response) => ({ data: response.data as SearchData, meta: response.meta })));
  }
}
