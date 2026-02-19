import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';

import { ApiResponse } from '../models/api.models';
import { ErrorStoreService } from '../errors/error-store.service';
import { SKIP_GLOBAL_ERROR } from './http-context.tokens';

function getDefaultMessage(status: number): string {
  if (status === 0) {
    return 'No se pudo conectar con el backend.';
  }
  if (status === 401) {
    return 'Tu sesión expiró o no tienes autorización.';
  }
  if (status === 403) {
    return 'No tienes permisos para esta acción.';
  }
  if (status === 404) {
    return 'El recurso solicitado no existe.';
  }
  if (status === 429) {
    return 'Demasiadas solicitudes. Inténtalo nuevamente en unos segundos.';
  }
  if (status >= 500) {
    return 'El servidor tuvo un problema al procesar la solicitud.';
  }
  return 'Ocurrió un error inesperado.';
}

export const errorInterceptor: HttpInterceptorFn = (request, next) => {
  if (request.context.get(SKIP_GLOBAL_ERROR)) {
    return next(request);
  }

  const errorStore = inject(ErrorStoreService);

  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse) {
        const apiError = (error.error as ApiResponse<unknown> | undefined)?.error;
        const title = apiError?.code ?? `HTTP ${error.status || 'ERROR'}`;
        const message = apiError?.message ?? getDefaultMessage(error.status);
        const details = apiError?.details ?? undefined;

        errorStore.pushAlert('error', title, message, details);
      }

      return throwError(() => error);
    })
  );
};
