import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, AuthUser, UserListData } from '../models/api.models';

export interface UpdateUserRequest {
  role: 'viewer' | 'editor' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class UsersApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/users';

  list(): Observable<AuthUser[]> {
    return this.http
      .get<ApiResponse<UserListData>>(this.baseUrl)
      .pipe(map((response) => response.data?.users ?? []));
  }

  get(userId: string): Observable<AuthUser> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/${encodeURIComponent(userId)}`)
      .pipe(map((response) => response.data as AuthUser));
  }

  update(userId: string, payload: UpdateUserRequest): Observable<AuthUser> {
    return this.http
      .put<ApiResponse<AuthUser>>(`${this.baseUrl}/${encodeURIComponent(userId)}`, payload)
      .pipe(map((response) => response.data as AuthUser));
  }

  delete(userId: string): Observable<boolean> {
    return this.http
      .delete<ApiResponse<{ deleted: boolean }>>(`${this.baseUrl}/${encodeURIComponent(userId)}`)
      .pipe(map((response) => Boolean(response.data?.deleted)));
  }
}
