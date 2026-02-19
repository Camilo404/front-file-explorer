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
}
