import { inject, Injectable, signal } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, finalize, Observable, of, shareReplay, tap, throwError } from 'rxjs';

import { AuthApiService, LoginRequest } from '../api/auth-api.service';
import { AuthUser, TokenPair, UserRole } from '../models/api.models';

interface SessionData {
  tokenPair: TokenPair;
}

@Injectable({ providedIn: 'root' })
export class AuthStoreService {
  private readonly sessionKey = 'file-explorer.session';
  private readonly authApi = inject(AuthApiService);
  private readonly router = inject(Router);
  private refreshTimer: ReturnType<typeof setTimeout> | null = null;
  private refreshRequest$: Observable<TokenPair> | null = null;

  readonly tokenPair = signal<TokenPair | null>(null);
  readonly user = signal<AuthUser | null>(null);
  readonly isRefreshing = signal(false);
  readonly forcePasswordChange = signal(false);

  constructor() {
    this.hydrate();
  }

  get accessToken(): string | null {
    return this.tokenPair()?.access_token ?? null;
  }

  get refreshToken(): string | null {
    return this.tokenPair()?.refresh_token ?? null;
  }

  get isAuthenticated(): boolean {
    return Boolean(this.accessToken);
  }

  hasRole(roles: UserRole[]): boolean {
    const currentRole = this.user()?.role;
    return !!currentRole && roles.includes(currentRole);
  }

  login(payload: LoginRequest): Observable<TokenPair> {
    return this.authApi.login(payload).pipe(
      tap((tokenPair) => {
        this.setSession(tokenPair);

        // Detect force_password_change from the login response.
        if (tokenPair.force_password_change) {
          this.forcePasswordChange.set(true);
        }
      })
    );
  }

  refresh(): Observable<TokenPair | null> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      return of(null);
    }

    if (this.refreshRequest$) {
      return this.refreshRequest$;
    }

    this.isRefreshing.set(true);

    this.refreshRequest$ = this.authApi.refresh({ refresh_token: refreshToken }).pipe(
      tap((tokenPair) => {
        this.setSession(tokenPair);
        this.isRefreshing.set(false);

        if (tokenPair.force_password_change) {
          this.forcePasswordChange.set(true);
        }
      }),
      catchError((err) => {
        this.clearSession();
        this.isRefreshing.set(false);
        return throwError(() => err);
      }),
      finalize(() => {
        this.refreshRequest$ = null;
      }),
      shareReplay(1)
    );

    return this.refreshRequest$;
  }

  logout(): Observable<boolean> {
    const refreshToken = this.refreshToken;
    if (!refreshToken) {
      this.clearSession();
      return of(true);
    }

    return this.authApi.logout({ refresh_token: refreshToken }).pipe(
      tap(() => this.clearSession())
    );
  }

  /** Called after a successful forced password change to clear the flag. */
  clearForcePasswordChange(): void {
    this.forcePasswordChange.set(false);
  }

  setSession(tokenPair: TokenPair): void {
    this.tokenPair.set(tokenPair);
    this.user.set(tokenPair.user);
    this.persistSession({ tokenPair });
    this.scheduleProactiveRefresh(tokenPair.expires_in);
  }

  clearSession(): void {
    this.clearRefreshTimer();
    this.tokenPair.set(null);
    this.user.set(null);
    this.forcePasswordChange.set(false);
    sessionStorage.removeItem(this.sessionKey);
    void this.router.navigate(['/auth/login']);
  }

  private hydrate(): void {
    const rawValue = sessionStorage.getItem(this.sessionKey);
    if (!rawValue) {
      return;
    }

    try {
      const parsed = JSON.parse(rawValue) as SessionData;
      if (!parsed.tokenPair?.access_token || !parsed.tokenPair?.refresh_token) {
        this.clearSession();
        return;
      }

      this.tokenPair.set(parsed.tokenPair);
      this.user.set(parsed.tokenPair.user);
      this.scheduleProactiveRefresh(parsed.tokenPair.expires_in);

      // Restore force_password_change state from persisted session.
      if (parsed.tokenPair.force_password_change || parsed.tokenPair.user?.force_password_change) {
        this.forcePasswordChange.set(true);
      }
    } catch {
      this.clearSession();
    }
  }

  private persistSession(session: SessionData): void {
    sessionStorage.setItem(this.sessionKey, JSON.stringify(session));
  }

  private scheduleProactiveRefresh(expiresInSeconds: number): void {
    this.clearRefreshTimer();

    if (!Number.isFinite(expiresInSeconds) || expiresInSeconds <= 0) {
      return;
    }

    const expiresInMs = expiresInSeconds * 1000;
    const proactiveWindowMs = 60_000;
    const minDelayMs = 5_000;
    const refreshInMs = Math.max(minDelayMs, expiresInMs - proactiveWindowMs);

    this.refreshTimer = setTimeout(() => {
      this.refresh().subscribe({
        next: () => {},
        error: () => {},
      });
    }, refreshInMs);
  }

  private clearRefreshTimer(): void {
    if (!this.refreshTimer) {
      return;
    }

    clearTimeout(this.refreshTimer);
    this.refreshTimer = null;
  }
}
