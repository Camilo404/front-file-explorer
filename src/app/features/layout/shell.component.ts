import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
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
  template: `
    <div class="min-h-screen bg-slate-900 text-slate-200 font-sans selection:bg-indigo-500/30">
      <!-- Header -->
      <header class="sticky top-0 z-40 w-full backdrop-blur flex-none transition-colors duration-500 lg:z-50 lg:border-b lg:border-slate-800 bg-slate-900/80">
        <div class="mx-auto max-w-400 px-4 sm:px-6 lg:px-8">
          <div class="flex h-16 items-center justify-between">
            <!-- Left side: Logo & Nav -->
            <div class="flex items-center gap-8">
              <div class="flex items-center gap-2">
                <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white font-bold shadow-lg shadow-indigo-500/20">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">
                    <path d="M19.5 21a3 3 0 0 0 3-3v-4.5a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3V18a3 3 0 0 0 3 3h15ZM1.5 10.146V6a3 3 0 0 1 3-3h5.379a2.25 2.25 0 0 1 1.59.659l2.122 2.121c.14.141.331.22.53.22H19.5a3 3 0 0 1 3 3v1.146A4.483 4.483 0 0 0 19.5 9h-15a4.483 4.483 0 0 0-3 1.146Z" />
                  </svg>
                </div>
                <span class="text-lg font-semibold tracking-tight text-white hidden sm:block">FileExplorer</span>
              </div>
              
              <nav class="hidden md:flex items-center gap-1 text-sm font-medium">
                <a routerLink="/explorer" routerLinkActive="bg-slate-800 text-white" class="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Explorer</a>
                @if (canManageFiles()) {
                  <a routerLink="/jobs" routerLinkActive="bg-slate-800 text-white" class="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Jobs</a>
                  <a routerLink="/trash" routerLinkActive="bg-slate-800 text-white" class="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Trash</a>
                }
                @if (isAdmin()) {
                  <a routerLink="/audit" routerLinkActive="bg-slate-800 text-white" class="rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors">Audit</a>
                }
              </nav>
            </div>

            <!-- Right side: Actions & Profile -->
            <div class="flex items-center gap-4">
              <div class="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/50 border border-slate-700/50">
                <div class="h-2 w-2 rounded-full" [class.bg-emerald-500]="healthStatus() === 'API: ok'" [class.bg-rose-500]="healthStatus() !== 'API: ok'"></div>
                <span class="text-xs font-medium text-slate-400">{{ healthStatus() }}</span>
              </div>

              @if (isAdmin()) {
                <button
                  type="button"
                  class="inline-flex items-center justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all"
                  (click)="toggleRegisterUserForm()"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-4 h-4 mr-1.5">
                    <path d="M10 5a3 3 0 1 1-6 0 3 3 0 0 1 6 0ZM1.615 16.428a1.224 1.224 0 0 1-.569-1.175 6.002 6.002 0 0 1 11.908 0c.058.467-.172.92-.57 1.174A9.953 9.953 0 0 1 7 18a9.953 9.953 0 0 1-5.385-1.572ZM16.25 5.75a.75.75 0 0 0-1.5 0v2h-2a.75.75 0 0 0 0 1.5h2v2a.75.75 0 0 0 1.5 0v-2h2a.75.75 0 0 0 0-1.5h-2v-2Z" />
                  </svg>
                  New User
                </button>
              }

              <div class="flex items-center gap-3 pl-4 border-l border-slate-700 relative">
                <div class="flex flex-col items-end sm:flex">
                  <span class="text-sm font-medium text-white">{{ username() }}</span>
                  <span class="text-xs text-slate-400 capitalize">{{ role() }}</span>
                </div>
                <button
                  type="button"
                  class="rounded-full p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                  title="Logout"
                  (click)="onLogout()"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="w-5 h-5">
                    <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Mobile Nav (visible only on small screens) -->
        <div class="md:hidden border-t border-slate-800 px-4 py-2 overflow-x-auto">
          <nav class="flex items-center gap-2 text-sm font-medium">
            <a routerLink="/explorer" routerLinkActive="bg-slate-800 text-white" class="whitespace-nowrap rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">Explorer</a>
            @if (canManageFiles()) {
              <a routerLink="/jobs" routerLinkActive="bg-slate-800 text-white" class="whitespace-nowrap rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">Jobs</a>
              <a routerLink="/trash" routerLinkActive="bg-slate-800 text-white" class="whitespace-nowrap rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">Trash</a>
            }
            @if (isAdmin()) {
              <a routerLink="/audit" routerLinkActive="bg-slate-800 text-white" class="whitespace-nowrap rounded-md px-3 py-2 text-slate-300 hover:bg-slate-800 hover:text-white">Audit</a>
            }
          </nav>
        </div>

        <!-- Register Form Dropdown/Panel -->
        @if (isAdmin() && showRegisterForm()) {
          <div class="absolute right-4 top-16 mt-2 w-full max-w-sm rounded-xl border border-slate-700 bg-slate-800 p-5 shadow-2xl shadow-black/50 ring-1 ring-white/10 z-50">
            <div class="mb-4 flex items-center justify-between">
              <h3 class="text-sm font-semibold text-white">Create New User</h3>
              <button type="button" class="text-slate-400 hover:text-white transition-colors" (click)="toggleRegisterUserForm()">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5">
                  <path d="M6.28 5.22a.75.75 0 0 0-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 1 0 1.06 1.06L10 11.06l3.72 3.72a.75.75 0 1 0 1.06-1.06L11.06 10l3.72-3.72a.75.75 0 0 0-1.06-1.06L10 8.94 6.28 5.22Z" />
                </svg>
              </button>
            </div>
            <form class="grid gap-4" [formGroup]="registerForm" (ngSubmit)="submitRegisterUser()">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Username</label>
                <input
                  type="text"
                  formControlName="username"
                  placeholder="Enter username"
                  class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Password</label>
                <input
                  type="password"
                  formControlName="password"
                  placeholder="Enter password"
                  class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-slate-400">Role</label>
                <select formControlName="role" class="w-full rounded-lg border border-slate-600 bg-slate-900/50 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-shadow">
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

      <!-- Main Content -->
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

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    role: this.fb.nonNullable.control<'viewer' | 'editor' | 'admin'>('viewer', Validators.required),
  });

  constructor() {
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
    this.authStore.logout().subscribe({
      next: () => {
        void this.router.navigate(['/auth/login']);
      },
    });
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
