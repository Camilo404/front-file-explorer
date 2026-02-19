import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import {
  ApiResponse,
  CopyResponse,
  DeleteResponse,
  MoveResponse,
  RenameResponse,
  RestoreResponse,
} from '../models/api.models';

export type ConflictPolicy = 'rename' | 'overwrite' | 'skip';

@Injectable({ providedIn: 'root' })
export class OperationsApiService {
  private readonly http = inject(HttpClient);

  rename(path: string, newName: string): Observable<RenameResponse> {
    return this.http
      .put<ApiResponse<RenameResponse>>('/api/v1/files/rename', { path, new_name: newName })
      .pipe(map((response) => response.data as RenameResponse));
  }

  move(sources: string[], destination: string, conflictPolicy: ConflictPolicy): Observable<MoveResponse> {
    return this.http
      .put<ApiResponse<MoveResponse>>('/api/v1/files/move', {
        sources,
        destination,
        conflict_policy: conflictPolicy,
      })
      .pipe(map((response) => response.data as MoveResponse));
  }

  copy(sources: string[], destination: string, conflictPolicy: ConflictPolicy): Observable<CopyResponse> {
    return this.http
      .post<ApiResponse<CopyResponse>>('/api/v1/files/copy', {
        sources,
        destination,
        conflict_policy: conflictPolicy,
      })
      .pipe(map((response) => response.data as CopyResponse));
  }

  delete(paths: string[]): Observable<DeleteResponse> {
    return this.http
      .request<ApiResponse<DeleteResponse>>('DELETE', '/api/v1/files', { body: { paths } })
      .pipe(map((response) => response.data as DeleteResponse));
  }

  restore(paths: string[]): Observable<RestoreResponse> {
    return this.http
      .post<ApiResponse<RestoreResponse>>('/api/v1/files/restore', { paths })
      .pipe(map((response) => response.data as RestoreResponse));
  }
}
