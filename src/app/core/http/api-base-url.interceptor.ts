import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';

import { API_BASE_URL } from './api-base-url.token';

function isAbsoluteUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || url.startsWith('//');
}

export const apiBaseUrlInterceptor: HttpInterceptorFn = (request, next) => {
  if (isAbsoluteUrl(request.url)) {
    return next(request);
  }

  const apiBaseUrl = inject(API_BASE_URL).replace(/\/$/, '');
  const normalizedPath = request.url.startsWith('/') ? request.url : `/${request.url}`;
  const url = `${apiBaseUrl}${normalizedPath}`;

  return next(
    request.clone({
      url,
    })
  );
};
