import { ChangeDetectionStrategy, Component, effect, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';

import { AuthApiService } from '../../core/api/auth-api.service';
import { SystemApiService } from '../../core/api/system-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { WebSocketService } from '../../core/websocket/websocket.service';
import { UploadProgressPanelComponent } from '../../shared/components/upload-progress-panel.component';
import { HeaderComponent } from './components/header/header.component';
import { MobileMenuComponent } from './components/mobile-menu/mobile-menu.component';
import { SidebarComponent } from './components/sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    RouterOutlet, 
    UploadProgressPanelComponent,
    SidebarComponent,
    MobileMenuComponent,
    HeaderComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()',
  },
  template: `
    <div class="flex h-screen overflow-hidden">

      <!-- Desktop Sidebar -->
      <app-sidebar 
        [collapsed]="sidebarCollapsed()" 
        [healthStatus]="healthStatus()"
        (toggle)="toggleSidebar()"
        (logout)="onLogout()"
      />

      <!-- Main Content Area -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <!-- Mobile Header -->
        <app-header 
          [menuOpen]="mobileMenuOpen()"
          (toggle)="toggleMobileMenu()"
        />

        <!-- Mobile Bottom Sheet -->
        <app-mobile-menu 
          [isOpen]="mobileMenuOpen()"
          [healthStatus]="healthStatus()"
          (close)="closeMobileMenu()"
          (logout)="onLogout()"
        />

        <!-- Main Scrollable Area -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div class="mx-auto w-full">
            <router-outlet />
          </div>
        </main>
      </div>

      <app-upload-progress-panel />
    </div>
  `,
})
export class ShellComponent implements OnInit, OnDestroy {
  private readonly authStore = inject(AuthStoreService);
  private readonly authApi = inject(AuthApiService);
  private readonly systemApi = inject(SystemApiService);
  private readonly wsService = inject(WebSocketService);
  private readonly router = inject(Router);

  readonly healthStatus = signal('API: ...');
  readonly mobileMenuOpen = signal(false);
  readonly sidebarCollapsed = signal(false);

  constructor() {
    // Lock body scroll when mobile menu is open
    effect(() => {
      document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
    });

    // Auto-connect WS when authenticated
    effect(() => {
      if (this.authStore.isAuthenticated) {
        this.wsService.connect();
      } else {
        this.wsService.disconnect();
      }
    });

    this.authApi.me().subscribe({
      next: (user) => {
        const current = this.authStore.tokenPair();
        if (current) {
          this.authStore.setSession({ ...current, user });
        }
      },
    });

    this.systemApi.health().subscribe({
      next: (status) => {
        this.healthStatus.set(`API: ${status}`);
      },
      error: () => {
        this.healthStatus.set('API: down');
      },
    });
  }

  onLogout(): void {
    this.closeMobileMenu();
    this.authStore.logout().subscribe({
      next: () => {
        void this.router.navigate(['/auth/login']);
      },
    });
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  ngOnInit() {
    // Initial connection check is handled by the effect in constructor
  }

  ngOnDestroy() {
    this.wsService.disconnect();
  }
}
