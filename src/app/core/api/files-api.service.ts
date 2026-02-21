import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, FileItem, UploadResponse } from '../models/api.models';
import { AuthStoreService } from '../auth/auth-store.service';
import { API_BASE_URL } from '../http/api-base-url.token';

@Injectable({ providedIn: 'root' })
export class FilesApiService {
  private readonly http = inject(HttpClient);
  private readonly authStore = inject(AuthStoreService);
  private readonly apiBaseUrl = inject(API_BASE_URL);

  upload(path: string, files: File[], conflictPolicy?: string): Observable<UploadResponse> {
    const formData = new FormData();
    formData.append('path', path);
    if (conflictPolicy) {
      formData.append('conflict_policy', conflictPolicy);
    }

    for (const file of files) {
      formData.append('files', file, file.name);
    }

    let params = new HttpParams();
    if (conflictPolicy) {
      params = params.set('conflict_policy', conflictPolicy);
    }

    return this.http
      .post<ApiResponse<UploadResponse>>('/api/v1/files/upload', formData, { params })
      .pipe(map((response) => response.data as UploadResponse));
  }

  download(path: string, archive = false): Observable<Blob> {
    let params = new HttpParams().set('path', path);
    if (archive) {
      params = params.set('archive', 'true');
    }
    return this.http.get('/api/v1/files/download', { params, responseType: 'blob' });
  }

  preview(path: string): Observable<Blob> {
    const params = new HttpParams().set('path', path);
    return this.http.get('/api/v1/files/preview', { params, responseType: 'blob' });
  }

  thumbnail(path: string, size = 512): Observable<Blob> {
    const params = new HttpParams().set('path', path).set('size', size);
    return this.http.get('/api/v1/files/thumbnail', { params, responseType: 'blob' });
  }

  info(path: string): Observable<FileItem> {
    const params = new HttpParams().set('path', path);
    return this.http
      .get<ApiResponse<FileItem>>('/api/v1/files/info', { params })
      .pipe(map((response) => response.data as FileItem));
  }

  /**
   * Returns a direct URL to the preview endpoint with the auth token embedded
   * as a query parameter. This allows native `<video>` / `<audio>` elements to
   * stream content with Range request support (HTTP 206 Partial Content) instead
   * of downloading the entire file into memory first.
   */
  streamUrl(path: string): string {
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const token = this.authStore.accessToken;
    const params = new URLSearchParams({ path, token: token ?? '' });
    return `${base}/api/v1/files/preview?${params.toString()}`;
  }

  /**
   * Returns a direct URL to the thumbnail endpoint with the auth token embedded
   * as a query parameter. The browser fetches and caches the image natively
   * without an intermediate blob download.
   */
  thumbnailDirectUrl(path: string, size = 512): string {
    const base = this.apiBaseUrl.replace(/\/$/, '');
    const token = this.authStore.accessToken;
    const params = new URLSearchParams({
      path,
      size: String(size),
      token: token ?? '',
    });
    return `${base}/api/v1/files/thumbnail?${params.toString()}`;
  }
}
