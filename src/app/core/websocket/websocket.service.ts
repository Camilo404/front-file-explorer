import { Injectable, inject, OnDestroy } from '@angular/core';
import { Observable, Subject, timer, Subscription, EMPTY } from 'rxjs';
import { retry, share, switchMap, takeUntil, tap, delayWhen, filter } from 'rxjs/operators';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { environment } from '../../../environments/environment';
import { AuthStoreService } from '../auth/auth-store.service';
import { WSEvent, WSEventType } from './websocket.models';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService implements OnDestroy {
  private socket$: WebSocketSubject<WSEvent> | null = null;
  private messagesSubject$ = new Subject<WSEvent>();
  public messages$ = this.messagesSubject$.asObservable().pipe(share());
  
  private authStore = inject(AuthStoreService);
  private reconnectInterval = 3000;
  private destroy$ = new Subject<void>();
  private connectionSubscription: Subscription | null = null;
  
  constructor() {
    // Monitor auth state to connect/disconnect
    // We don't automatically connect in constructor to give control to the app shell
  }

  public connect(): void {
    if (this.socket$ || !this.authStore.isAuthenticated) {
      return;
    }

    const token = this.authStore.accessToken;
    if (!token) return;

    // Build URL with token
    let url = environment.wsUrl;
    if (url.startsWith('/')) {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      url = `${protocol}//${window.location.host}${url}`;
    }
    url = `${url}?token=${token}`;

    this.socket$ = webSocket<WSEvent>({
      url,
      openObserver: {
        next: () => {
          console.log('[WebSocket] Connected');
        }
      },
      closeObserver: {
        next: () => {
          console.log('[WebSocket] Disconnected');
          this.socket$ = null;
          this.scheduleReconnect();
        }
      }
    });

    this.connectionSubscription = this.socket$.pipe(
      retry({
        delay: (error, retryCount) => {
          console.error('[WebSocket] Error:', error);
          return timer(this.reconnectInterval);
        }
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (message) => this.messagesSubject$.next(message),
      error: (err) => console.error('[WebSocket] Fatal error:', err)
    });
  }

  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
    if (this.connectionSubscription) {
      this.connectionSubscription.unsubscribe();
      this.connectionSubscription = null;
    }
  }

  private scheduleReconnect(): void {
    if (!this.destroy$.observed) return;
    
    timer(this.reconnectInterval).pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      console.log('[WebSocket] Attempting reconnect...');
      this.connect();
    });
  }

  /**
   * Filter messages by event type
   */
  public on<T>(type: WSEventType): Observable<WSEvent<T>> {
    return this.messages$.pipe(
      filter(msg => msg.type === type)
    ) as Observable<WSEvent<T>>;
  }

  /**
   * Filter messages by multiple event types
   */
  public onTypes<T>(types: WSEventType[]): Observable<WSEvent<T>> {
    const typeSet = new Set(types);
    return this.messages$.pipe(
      filter(msg => typeSet.has(msg.type))
    ) as Observable<WSEvent<T>>;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.disconnect();
  }
}
