import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { ApiResponse, AuthUser, TokenPair } from '../models/api.models';
import { SKIP_AUTH, SKIP_GLOBAL_ERROR } from '../http/http-context.tokens';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface RefreshRequest {
  refresh_token: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  role: 'viewer' | 'editor' | 'admin';
}

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/auth';

  login(payload: LoginRequest): Observable<TokenPair> {
    return this.http
      .post<ApiResponse<TokenPair>>(`${this.baseUrl}/login`, payload, {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_GLOBAL_ERROR, true),
      })
      .pipe(map((response) => response.data as TokenPair));
  }

  refresh(payload: RefreshRequest): Observable<TokenPair> {
    return this.http
      .post<ApiResponse<TokenPair>>(`${this.baseUrl}/refresh`, payload, {
        context: new HttpContext().set(SKIP_AUTH, true).set(SKIP_GLOBAL_ERROR, true),
      })
      .pipe(map((response) => response.data as TokenPair));
  }

  logout(payload: RefreshRequest): Observable<boolean> {
    return this.http
      .post<ApiResponse<{ logged_out: boolean }>>(`${this.baseUrl}/logout`, payload)
      .pipe(map((response) => Boolean(response.data?.logged_out)));
  }

  me(): Observable<AuthUser> {
    return this.http
      .get<ApiResponse<AuthUser>>(`${this.baseUrl}/me`)
      .pipe(map((response) => response.data as AuthUser));
  }

  register(payload: RegisterRequest): Observable<AuthUser> {
    return this.http
      .post<ApiResponse<AuthUser>>(`${this.baseUrl}/register`, payload)
      .pipe(map((response) => response.data as AuthUser));
  }
}
