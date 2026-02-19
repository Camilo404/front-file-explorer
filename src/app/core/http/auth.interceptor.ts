import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandlerFn,
  HttpInterceptorFn,
  HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, Observable, switchMap, throwError } from 'rxjs';

import { AuthStoreService } from '../auth/auth-store.service';
import { SKIP_AUTH } from './http-context.tokens';

function isAuthEndpoint(url: string): boolean {
  return url.includes('/api/v1/auth/login') || url.includes('/api/v1/auth/refresh');
}

export const authInterceptor: HttpInterceptorFn = (
  request: HttpRequest<unknown>,
  next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
  if (request.context.get(SKIP_AUTH)) {
    return next(request);
  }

  const authStore = inject(AuthStoreService);
  const router = inject(Router);
  const accessToken = authStore.accessToken;

  const authorizedRequest = accessToken
    ? request.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
    : request;

  return next(authorizedRequest).pipe(
    catchError((error: unknown) => {
      if (!(error instanceof HttpErrorResponse) || error.status !== 401 || isAuthEndpoint(request.url)) {
        return throwError(() => error);
      }

      return authStore.refresh().pipe(
        switchMap((tokenPair) => {
          if (!tokenPair?.access_token) {
            void router.navigate(['/auth/login']);
            return throwError(() => error);
          }

          const retriedRequest = request.clone({
            setHeaders: {
              Authorization: `Bearer ${tokenPair.access_token}`,
            },
          });

          return next(retriedRequest);
        }),
        catchError((refreshError) => {
          authStore.clearSession();
          return throwError(() => refreshError);
        })
      );
    })
  );
};
