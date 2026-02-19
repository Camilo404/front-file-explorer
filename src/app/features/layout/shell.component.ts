import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthApiService } from '../../core/api/auth-api.service';
import { SystemApiService } from '../../core/api/system-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'closeMobileMenu()',
  },
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
    .nav-item-1 { animation: navItemIn 0.3s 0.05s ease both; }
    .nav-item-2 { animation: navItemIn 0.3s 0.10s ease both; }
    .nav-item-3 { animation: navItemIn 0.3s 0.15s ease both; }
    .nav-item-4 { animation: navItemIn 0.3s 0.20s ease both; }
    .nav-item-5 { animation: navItemIn 0.3s 0.25s ease both; }

    .bar {
      display: block;
      width: 22px;
      height: 2px;
      background: currentColor;
      border-radius: 2px;
      transition: transform 0.3s ease, opacity 0.2s ease;
      transform-origin: center;
    }
    .bar-top-open    { transform: translateY(6px) rotate(45deg); }
    .bar-mid-open    { opacity: 0; transform: scaleX(0); }
    .bar-bot-open    { transform: translateY(-6px) rotate(-45deg); }
  `,
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">

      <!-- ═══════════════════════════════ HEADER ═══════════════════════════════ -->
      <header class="sticky top-0 z-40 w-full backdrop-blur-md flex-none border-b border-slate-800/60 bg-slate-900/80">
        <div class="mx-auto max-w-400 px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">

            <!-- Logo -->
            <div class="flex items-center gap-2.5">
              <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white shadow-lg shadow-indigo-500/30">
                <i class="fa-solid fa-folder-open text-sm"></i>
              </div>
              <span class="text-lg font-semibold tracking-tight text-white hidden sm:block">FileExplorer</span>
            </div>

            <!-- Desktop Nav -->
            <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
              <a routerLink="/explorer" routerLinkActive="bg-slate-800 text-white" class="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                <i class="fa-solid fa-folder-open text-xs"></i>Explorer
              </a>
              @if (canManageFiles()) {
                <a routerLink="/jobs" routerLinkActive="bg-slate-800 text-white" class="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <i class="fa-solid fa-list-check text-xs"></i>Jobs
                </a>
                <a routerLink="/trash" routerLinkActive="bg-slate-800 text-white" class="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <i class="fa-solid fa-trash text-xs"></i>Trash
                </a>
              }
              @if (isAdmin()) {
                <a routerLink="/audit" routerLinkActive="bg-slate-800 text-white" class="flex items-center gap-2 rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">
                  <i class="fa-solid fa-clipboard-list text-xs"></i>Audit
                </a>
              }
            </nav>

            <!-- Right side actions -->
            <div class="flex items-center gap-3">
              <!-- Health pill (desktop) -->
              <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                <div class="h-2 w-2 rounded-full" [class.bg-emerald-400]="healthStatus() === 'API: ok'" [class.bg-rose-500]="healthStatus() !== 'API: ok'"></div>
                <span class="text-xs font-medium text-slate-400">{{ healthStatus() }}</span>
              </div>

              <!-- New User button (desktop, admin only) -->
              @if (isAdmin()) {
                <button
                  type="button"
                  class="hidden md:inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                  (click)="toggleRegisterUserForm()"
                >
                  <i class="fa-solid fa-user-plus mr-1.5 text-xs"></i>
                  New User
                </button>
              }

              <!-- Desktop profile + logout -->
              <div class="hidden md:flex items-center gap-3 pl-3 border-l border-slate-700">
                <div class="flex flex-col items-end">
                  <span class="text-sm font-medium text-white leading-none">{{ username() }}</span>
                  <span class="text-xs text-slate-400 capitalize mt-0.5">{{ role() }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Logout"
                  (click)="onLogout()"
                >
                  <i class="fa-solid fa-right-from-bracket text-base"></i>
                </button>
              </div>

              <!-- ── MOBILE hamburger ── -->
              <button
                type="button"
                class="md:hidden flex flex-col items-center justify-center gap-1.25 w-10 h-10 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                aria-label="Toggle menu"
                [attr.aria-expanded]="mobileMenuOpen()"
                (click)="toggleMobileMenu()"
              >
                <span class="bar" [class.bar-top-open]="mobileMenuOpen()"></span>
                <span class="bar" [class.bar-mid-open]="mobileMenuOpen()"></span>
                <span class="bar" [class.bar-bot-open]="mobileMenuOpen()"></span>
              </button>
            </div>
          </div>
        </div>

        <!-- Register Form Panel (desktop) -->
        @if (isAdmin() && showRegisterForm()) {
          <div class="absolute right-4 top-16 mt-2 w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-2xl shadow-black/50 ring-1 ring-white/10 z-50">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-white">Create New User</h3>
              <button type="button" class="text-slate-400 hover:text-white transition-colors" (click)="toggleRegisterUserForm()">
                <i class="fa-solid fa-xmark text-lg"></i>
              </button>
            </div>
            <form class="grid gap-4" [formGroup]="registerForm" (ngSubmit)="submitRegisterUser()">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Username</label>
                <input type="text" formControlName="username" placeholder="Enter username"
                  class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                <input type="password" formControlName="password" placeholder="Enter password"
                  class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Role</label>
                <select formControlName="role"
                  class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow">
                  <option value="viewer">Viewer</option>
                  <option value="editor">Editor</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div class="mt-2 flex gap-3">
                <button type="button" class="flex-1 rounded-lg bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600 transition-colors" (click)="toggleRegisterUserForm()">Cancel</button>
                <button type="submit" class="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors" [disabled]="registerForm.invalid">Create User</button>
              </div>
            </form>
          </div>
        }
      </header>

      <!-- ══════════════════════ MOBILE BOTTOM-SHEET MENU ══════════════════════ -->
      @if (mobileMenuOpen()) {
        <!-- Backdrop -->
        <div
          class="md:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm backdrop-enter"
          aria-hidden="true"
          (click)="closeMobileMenu()"
        ></div>

        <!-- Sheet -->
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Navigation menu"
          class="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-slate-900 border-t border-slate-700/60 shadow-2xl shadow-black/70 sheet-enter pb-safe"
        >
          <!-- Handle bar -->
          <div class="flex justify-center pt-3 pb-1">
            <div class="w-10 h-1 rounded-full bg-slate-600"></div>
          </div>

          <!-- Profile card -->
          <div class="mx-4 mt-3 mb-4 flex items-center gap-3 rounded-2xl bg-slate-800/70 border border-slate-700/50 px-4 py-3">
            <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-indigo-500/30 uppercase">
              {{ username().charAt(0) }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-semibold text-white truncate">{{ username() }}</p>
              <p class="text-xs text-slate-400 capitalize">{{ role() }}</p>
            </div>
            <!-- Health pill -->
            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
              [class.border-emerald-500]="healthStatus() === 'API: ok'"
              [class.bg-emerald-500]="healthStatus() === 'API: ok'"
              [class.bg-opacity-10]="healthStatus() === 'API: ok'"
              [class.border-rose-500]="healthStatus() !== 'API: ok'"
              [class.bg-rose-500]="healthStatus() !== 'API: ok'"
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
          <nav class="px-4 grid gap-2" aria-label="Main navigation">
            <a
              routerLink="/explorer"
              routerLinkActive #explorerActive="routerLinkActive"
              class="nav-item-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
              [class.bg-indigo-600]="explorerActive.isActive"
              [class.shadow-lg]="explorerActive.isActive"
              [class.shadow-indigo-500]="explorerActive.isActive"
              [class.text-white]="explorerActive.isActive"
              [class.bg-slate-800]="!explorerActive.isActive"
              [class.text-slate-300]="!explorerActive.isActive"
              [class.hover:bg-slate-700]="!explorerActive.isActive"
              (click)="closeMobileMenu()"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                [class.bg-white]="explorerActive.isActive"
                [class.bg-slate-700]="!explorerActive.isActive">
                <i class="fa-solid fa-folder-open text-base" [class.text-indigo-600]="explorerActive.isActive"></i>
              </span>
              <div class="flex-1">
                <p class="text-sm font-semibold">Explorer</p>
                <p class="text-xs opacity-60">Browse your files</p>
              </div>
              @if (explorerActive.isActive) {
                <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
              }
            </a>

            @if (canManageFiles()) {
              <a
                routerLink="/jobs"
                routerLinkActive #jobsActive="routerLinkActive"
                class="nav-item-2 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                [class.bg-violet-600]="jobsActive.isActive"
                [class.shadow-lg]="jobsActive.isActive"
                [class.shadow-violet-500]="jobsActive.isActive"
                [class.text-white]="jobsActive.isActive"
                [class.bg-slate-800]="!jobsActive.isActive"
                [class.text-slate-300]="!jobsActive.isActive"
                (click)="closeMobileMenu()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class.bg-white]="jobsActive.isActive"
                  [class.bg-slate-700]="!jobsActive.isActive">
                  <i class="fa-solid fa-list-check text-base" [class.text-violet-600]="jobsActive.isActive"></i>
                </span>
                <div class="flex-1">
                  <p class="text-sm font-semibold">Jobs</p>
                  <p class="text-xs opacity-60">Async operations</p>
                </div>
                @if (jobsActive.isActive) {
                  <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                }
              </a>

              <a
                routerLink="/trash"
                routerLinkActive #trashActive="routerLinkActive"
                class="nav-item-3 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                [class.bg-rose-600]="trashActive.isActive"
                [class.shadow-lg]="trashActive.isActive"
                [class.shadow-rose-500]="trashActive.isActive"
                [class.text-white]="trashActive.isActive"
                [class.bg-slate-800]="!trashActive.isActive"
                [class.text-slate-300]="!trashActive.isActive"
                (click)="closeMobileMenu()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class.bg-white]="trashActive.isActive"
                  [class.bg-slate-700]="!trashActive.isActive">
                  <i class="fa-solid fa-trash text-base" [class.text-rose-600]="trashActive.isActive"></i>
                </span>
                <div class="flex-1">
                  <p class="text-sm font-semibold">Trash</p>
                  <p class="text-xs opacity-60">Deleted files</p>
                </div>
                @if (trashActive.isActive) {
                  <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                }
              </a>
            }

            @if (isAdmin()) {
              <a
                routerLink="/audit"
                routerLinkActive #auditActive="routerLinkActive"
                class="nav-item-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                [class.bg-amber-600]="auditActive.isActive"
                [class.shadow-lg]="auditActive.isActive"
                [class.shadow-amber-500]="auditActive.isActive"
                [class.text-white]="auditActive.isActive"
                [class.bg-slate-800]="!auditActive.isActive"
                [class.text-slate-300]="!auditActive.isActive"
                (click)="closeMobileMenu()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class.bg-white]="auditActive.isActive"
                  [class.bg-slate-700]="!auditActive.isActive">
                  <i class="fa-solid fa-clipboard-list text-base" [class.text-amber-600]="auditActive.isActive"></i>
                </span>
                <div class="flex-1">
                  <p class="text-sm font-semibold">Audit</p>
                  <p class="text-xs opacity-60">Activity logs</p>
                </div>
                @if (auditActive.isActive) {
                  <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                }
              </a>
            }
          </nav>

          <!-- Bottom row: New User + Logout -->
          <div class="mx-4 mt-4 mb-6 grid gap-2 nav-item-5">
            @if (isAdmin()) {
              <button
                type="button"
                class="flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3.5 text-slate-300 hover:bg-slate-700 transition-all active:scale-95"
                (click)="openRegisterFromMobile()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-indigo-600/20">
                  <i class="fa-solid fa-user-plus text-base text-indigo-400"></i>
                </span>
                <div class="flex-1 text-left">
                  <p class="text-sm font-semibold">New User</p>
                  <p class="text-xs opacity-60">Create an account</p>
                </div>
              </button>
            }
            <button
              type="button"
              class="flex items-center gap-3 rounded-2xl bg-slate-800 px-4 py-3.5 text-slate-300 hover:bg-rose-900/40 hover:text-rose-300 transition-all active:scale-95"
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
        </div>
      }

      <!-- ══════════════════════════ MAIN CONTENT ══════════════════════════ -->
      <main class="mx-auto max-w-400 p-4 sm:p-6 lg:p-8">
        <router-outlet />
      </main>
    </div>
  `,
})
export class ShellComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStoreService);
  private readonly authApi = inject(AuthApiService);
  private readonly systemApi = inject(SystemApiService);
  private readonly router = inject(Router);
  private readonly feedback = inject(ErrorStoreService);

  readonly username = computed(() => this.authStore.user()?.username ?? 'anonymous');
  readonly role = computed(() => this.authStore.user()?.role ?? 'guest');
  readonly isAdmin = computed(() => this.authStore.user()?.role === 'admin');
  readonly canManageFiles = computed(() => {
    const role = this.authStore.user()?.role;
    return role === 'editor' || role === 'admin';
  });
  readonly healthStatus = signal('API: ...');
  readonly showRegisterForm = signal(false);
  readonly mobileMenuOpen = signal(false);

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    role: this.fb.nonNullable.control<'viewer' | 'editor' | 'admin'>('viewer', Validators.required),
  });

  constructor() {
    // Lock body scroll when mobile menu is open
    effect(() => {
      document.body.style.overflow = this.mobileMenuOpen() ? 'hidden' : '';
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

  openRegisterFromMobile(): void {
    this.closeMobileMenu();
    this.showRegisterForm.set(true);
  }

  toggleRegisterUserForm(): void {
    this.showRegisterForm.update((current) => !current);
  }

  submitRegisterUser(): void {
    if (this.registerForm.invalid) {
      this.feedback.warning('REGISTER', 'Completa username, password y rol válido.');
      return;
    }

    const payload = this.registerForm.getRawValue();
    this.authApi.register(payload).subscribe({
      next: () => {
        this.feedback.success('REGISTER', `Usuario ${payload.username} creado con rol ${payload.role}.`);
        this.registerForm.reset({ username: '', password: '', role: 'viewer' });
        this.showRegisterForm.set(false);
      },
      error: () => {},
    });
  }
}
