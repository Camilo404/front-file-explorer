import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SystemApiService {
  private readonly http = inject(HttpClient);

  health(): Observable<string> {
    return this.http.get('/health', { responseType: 'text' }).pipe(map((value) => value));
  }
}
