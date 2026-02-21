import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, StorageStats } from '../models/api.models';

@Injectable({ providedIn: 'root' })
export class StorageApiService {
  private readonly http = inject(HttpClient);

  getStats(): Observable<StorageStats> {
    return this.http
      .get<ApiResponse<StorageStats>>('/api/v1/storage/stats')
      .pipe(map((response) => response.data as StorageStats));
  }
}
