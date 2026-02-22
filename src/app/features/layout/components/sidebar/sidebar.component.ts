import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStoreService } from '../../../../core/auth/auth-store.service';
import { NAVIGATION_ITEMS } from '../../config/navigation';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <aside 
      class="hidden md:flex flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 relative z-40 h-full"
      [class.w-64]="!collapsed()" 
      [class.w-20]="collapsed()"
    >
      <!-- Logo -->
      <div class="flex h-16 items-center px-4 shrink-0 border-b border-white/5" [class.justify-center]="collapsed()">
        <div class="flex items-center gap-3">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/20">
            <i class="fa-solid fa-folder-open text-sm"></i>
          </div>
          @if (!collapsed()) {
            <span class="text-lg font-semibold tracking-tight text-white truncate">FileExplorer</span>
          }
        </div>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5 custom-scrollbar">
        @for (item of navItems(); track item.path) {
          @if (hasRole(item.roles)) {
            <a 
              [routerLink]="item.path" 
              routerLinkActive 
              #rla="routerLinkActive" 
              class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
              [class]="rla.isActive ? (item.activeBgClass + ' ' + item.activeShadowClass + ' text-white shadow-md') : 'text-zinc-400 hover:bg-white/5 hover:text-white'"
              [class.justify-center]="collapsed()" 
              [title]="item.label"
            >
              <i [class]="item.icon + ' text-sm shrink-0 group-hover:scale-110 transition-transform ' + (rla.isActive ? 'text-white' : '')"></i>
              @if (!collapsed()) {
                <span class="text-sm font-medium truncate">{{ item.label }}</span>
              }
            </a>
          }
        }
      </nav>

      <!-- Bottom Section -->
      <div class="p-3 border-t border-white/5 flex flex-col gap-3 shrink-0 bg-zinc-950/50">
        <!-- Health -->
        <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5" [class.justify-center]="collapsed()" [title]="healthStatus()">
          <div class="h-2 w-2 shrink-0 rounded-full shadow-sm" 
            [class.bg-emerald-400]="healthStatus() === 'API: ok'" 
            [class.shadow-emerald-500/50]="healthStatus() === 'API: ok'" 
            [class.bg-rose-500]="healthStatus() !== 'API: ok'" 
            [class.shadow-rose-500/50]="healthStatus() !== 'API: ok'">
          </div>
          @if (!collapsed()) {
            <span class="text-xs font-medium text-zinc-400 truncate">{{ healthStatus() }}</span>
          }
        </div>

        <!-- User Profile & Logout -->
        <div class="flex items-center gap-3 px-2 py-1" [class.justify-center]="collapsed()" [class.flex-col]="collapsed()">
          <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-600 text-white font-bold text-xs shadow-md uppercase" [title]="username() + ' (' + role() + ')'">
            {{ username().charAt(0) }}
          </div>
          @if (!collapsed()) {
            <div class="flex-1 min-w-0 flex flex-col">
              <span class="text-sm font-medium text-white truncate leading-tight">{{ username() }}</span>
              <span class="text-xs text-zinc-500 capitalize truncate">{{ role() }}</span>
            </div>
          }
          <button type="button" class="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors" title="Logout" (click)="onLogout()">
            <i class="fa-solid fa-right-from-bracket text-sm"></i>
          </button>
        </div>

        <!-- Collapse Toggle -->
        <button type="button" class="hidden md:flex items-center justify-center w-full rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors" (click)="toggle.emit()" [title]="collapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
          <i class="fa-solid text-xs transition-transform duration-300" [class.fa-chevron-left]="!collapsed()" [class.fa-chevron-right]="collapsed()"></i>
        </button>
      </div>
    </aside>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `
})
export class SidebarComponent {
  readonly collapsed = input.required<boolean>();
  readonly healthStatus = input.required<string>();
  
  readonly toggle = output<void>();
  readonly logout = output<void>();

  private readonly authStore = inject(AuthStoreService);
  
  readonly username = computed(() => this.authStore.user()?.username ?? 'anonymous');
  readonly role = computed(() => this.authStore.user()?.role ?? 'guest');
  
  readonly navItems = computed(() => NAVIGATION_ITEMS);

  hasRole(roles?: string[]): boolean {
    if (!roles || roles.length === 0) return true;
    const userRole = this.role();
    return roles.includes(userRole);
  }

  onLogout(): void {
    this.logout.emit();
  }
}
