import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthStoreService } from '../../../../core/auth/auth-store.service';
import { NAVIGATION_ITEMS } from '../../config/navigation';

@Component({
  selector: 'app-mobile-menu',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    @if (isOpen()) {
      <!-- Backdrop -->
      <div
        class="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm backdrop-enter"
        aria-hidden="true"
        (click)="close.emit()"
      ></div>

      <!-- Sheet -->
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        class="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl shadow-black/70 sheet-enter pb-safe max-h-[85vh] flex flex-col"
      >
        <!-- Handle bar -->
        <div class="flex justify-center pt-3 pb-1 shrink-0">
          <div class="w-10 h-1 rounded-full bg-white/20"></div>
        </div>

        <!-- Profile card -->
        <div class="mx-4 mt-3 mb-4 flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shrink-0">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 uppercase">
            {{ username().charAt(0) }}
          </div>
          <div class="flex-1 min-w-0">
            <p class="text-sm font-semibold text-white truncate">{{ username() }}</p>
            <p class="text-xs text-zinc-400 capitalize">{{ role() }}</p>
          </div>
          <!-- Health pill -->
          <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
            [class.border-emerald-500/30]="healthStatus() === 'API: ok'"
            [class.bg-emerald-500/10]="healthStatus() === 'API: ok'"
            [class.border-rose-500/30]="healthStatus() !== 'API: ok'"
            [class.bg-rose-500/10]="healthStatus() !== 'API: ok'"
          >
            <div class="h-1.5 w-1.5 rounded-full"
              [class.bg-emerald-400]="healthStatus() === 'API: ok'"
              [class.bg-rose-400]="healthStatus() !== 'API: ok'">
            </div>
            <span class="text-xs font-medium"
              [class.text-emerald-400]="healthStatus() === 'API: ok'"
              [class.text-rose-400]="healthStatus() !== 'API: ok'">
              {{ healthStatus() === 'API: ok' ? 'Online' : 'Offline' }}
            </span>
          </div>
        </div>

        <!-- Nav items -->
        <nav class="px-4 flex-1 overflow-y-auto custom-scrollbar grid gap-2 pb-4" aria-label="Main navigation">
          @for (item of navItems(); track item.path; let i = $index) {
            @if (hasRole(item.roles)) {
              <a
                [routerLink]="item.path"
                routerLinkActive 
                #rla="routerLinkActive"
                class="flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95 nav-item-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                [style.animation-delay]="(0.05 * (i + 1)) + 's'"
                [class]="rla.isActive ? (item.activeBgClass + ' ' + item.activeShadowClass + ' text-white shadow-lg') : 'bg-white/5 text-zinc-300 hover:bg-white/10'"
                (click)="close.emit()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class]="rla.isActive ? 'bg-white' : 'bg-white/10'">
                  <i [class]="item.icon + ' text-base ' + (rla.isActive ? item.activeIconClass : '')"></i>
                </span>
                <div class="flex-1">
                  <p class="text-sm font-semibold">{{ item.label }}</p>
                  @if (item.description) {
                    <p class="text-xs opacity-60">{{ item.description }}</p>
                  }
                </div>
                @if (rla.isActive) {
                  <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                }
              </a>
            }
          }

          <!-- Bottom row: Logout -->
          <div class="mt-2 grid gap-2 nav-item-in" [style.animation-delay]="(0.05 * (navItems().length + 1)) + 's'">
            <button
              type="button"
              class="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-zinc-300 hover:bg-rose-900/40 hover:text-rose-300 transition-all active:scale-95 w-full"
              (click)="onLogout()"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-600/20">
                <i class="fa-solid fa-right-from-bracket text-base text-rose-400"></i>
              </span>
              <div class="flex-1 text-left">
                <p class="text-sm font-semibold">Sign out</p>
                <p class="text-xs opacity-60">{{ username() }}</p>
              </div>
            </button>
          </div>
        </nav>
      </div>
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    @keyframes slideUp {
      from { transform: translateY(100%); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to   { opacity: 1; }
    }
    @keyframes navItemIn {
      from { transform: translateY(20px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }
    .sheet-enter { animation: slideUp 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards; }
    .backdrop-enter { animation: fadeIn 0.25s ease forwards; }
    .nav-item-in { animation: navItemIn 0.3s ease both; }

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
export class MobileMenuComponent {
  readonly isOpen = input.required<boolean>();
  readonly healthStatus = input.required<string>();
  
  readonly close = output<void>();
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
