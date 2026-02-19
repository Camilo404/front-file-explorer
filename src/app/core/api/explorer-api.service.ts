import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  ApiMeta,
  ApiResponse,
  DirectoryCreateData,
  DirectoryListData,
  TreeData,
} from '../models/api.models';

export interface DirectoryListQuery {
  path?: string;
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface TreeQuery {
  path?: string;
  depth?: number;
  include_files?: boolean;
  page?: number;
  limit?: number;
}

export interface ApiWithMeta<T> {
  data: T;
  meta?: ApiMeta;
}

@Injectable({ providedIn: 'root' })
export class ExplorerApiService {
  private readonly http = inject(HttpClient);

  list(query: DirectoryListQuery): Observable<ApiWithMeta<DirectoryListData>> {
    let params = new HttpParams();
    if (query.path) params = params.set('path', query.path);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);
    if (query.sort) params = params.set('sort', query.sort);
    if (query.order) params = params.set('order', query.order);

    return this.http
      .get<ApiResponse<DirectoryListData>>('/api/v1/files', { params })
      .pipe(map((response) => ({ data: response.data as DirectoryListData, meta: response.meta })));
  }

  tree(query: TreeQuery): Observable<ApiWithMeta<TreeData>> {
    let params = new HttpParams();
    if (query.path) params = params.set('path', query.path);
    if (query.depth) params = params.set('depth', query.depth);
    if (query.include_files !== undefined) params = params.set('include_files', query.include_files);
    if (query.page) params = params.set('page', query.page);
    if (query.limit) params = params.set('limit', query.limit);

    return this.http
      .get<ApiResponse<TreeData>>('/api/v1/tree', { params })
      .pipe(map((response) => ({ data: response.data as TreeData, meta: response.meta })));
  }

  createDirectory(path: string, name: string): Observable<DirectoryCreateData> {
    return this.http
      .post<ApiResponse<DirectoryCreateData>>('/api/v1/directories', { path, name })
      .pipe(map((response) => response.data as DirectoryCreateData));
  }
}
