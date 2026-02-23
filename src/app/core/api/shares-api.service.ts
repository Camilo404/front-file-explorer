import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { API_BASE_URL } from '../http/api-base-url.token';
import { ApiResponse, ShareListData, ShareRecord } from '../models/api.models';

export interface CreateShareRequest {
  path: string;
  expires_in?: string;
}

@Injectable({ providedIn: 'root' })
export class SharesApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/shares';
  private readonly apiBaseUrl = inject(API_BASE_URL);
  private readonly document = inject(DOCUMENT);

  create(payload: CreateShareRequest): Observable<ShareRecord> {
    return this.http
      .post<ApiResponse<ShareRecord>>(this.baseUrl, payload)
      .pipe(map((response) => response.data as ShareRecord));
  }

  list(): Observable<ShareRecord[]> {
    return this.http
      .get<ApiResponse<ShareListData>>(this.baseUrl)
      .pipe(map((response) => response.data?.shares ?? []));
  }

  revoke(shareId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<{ revoked: boolean }>>(`${this.baseUrl}/${encodeURIComponent(shareId)}`)
      .pipe(map((response) => Boolean(response.data?.revoked)));
  }

  getPublicDownloadUrl(token: string): string {
    return `/api/v1/public/shares/${encodeURIComponent(token)}`;
  }

  getAbsolutePublicDownloadUrl(token: string): string {
    let baseUrl = this.apiBaseUrl;
    // Remove trailing slash if present to avoid double slashes
    baseUrl = baseUrl.replace(/\/$/, '');
    
    if (!baseUrl.startsWith('http')) {
      baseUrl = this.document.location.origin + baseUrl;
    }
    return `${baseUrl}${this.getPublicDownloadUrl(token)}`;
  }
}
