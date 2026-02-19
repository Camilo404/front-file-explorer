import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterOutlet } from '@angular/router';

import { AuthApiService } from '../../core/api/auth-api.service';
import { SystemApiService } from '../../core/api/system-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterOutlet, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="min-h-screen bg-slate-950 text-slate-100">
      <header class="border-b border-slate-800 bg-slate-900">
        <div class="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <nav class="flex items-center gap-3 text-sm">
            <a routerLink="/explorer" class="rounded px-2 py-1 hover:bg-slate-800">Explorer</a>
            @if (canManageFiles()) {
              <a routerLink="/jobs" class="rounded px-2 py-1 hover:bg-slate-800">Jobs</a>
              <a routerLink="/trash" class="rounded px-2 py-1 hover:bg-slate-800">Trash</a>
            }
            @if (isAdmin()) {
              <a routerLink="/audit" class="rounded px-2 py-1 hover:bg-slate-800">Audit</a>
            }
          </nav>

          <div class="flex items-center gap-3 text-sm">
            <span class="text-xs text-slate-400">{{ healthStatus() }}</span>
            @if (isAdmin()) {
              <button
                type="button"
                class="rounded bg-indigo-700 px-3 py-1 hover:bg-indigo-600"
                (click)="toggleRegisterUserForm()"
              >
                Create User
              </button>
            }
            <span class="text-slate-300">{{ username() }}</span>
            <button
              type="button"
              class="rounded bg-slate-700 px-3 py-1 hover:bg-slate-600"
              (click)="onLogout()"
            >
              Logout
            </button>
          </div>
        </div>

        @if (isAdmin() && showRegisterForm()) {
          <form class="mt-3 grid gap-2 border-t border-slate-800 pt-3 md:grid-cols-4" [formGroup]="registerForm" (ngSubmit)="submitRegisterUser()">
            <input
              type="text"
              formControlName="username"
              placeholder="username"
              class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <input
              type="password"
              formControlName="password"
              placeholder="password"
              class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <select formControlName="role" class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
              <option value="viewer">viewer</option>
              <option value="editor">editor</option>
              <option value="admin">admin</option>
            </select>
            <div class="flex gap-2">
              <button type="submit" class="w-full rounded bg-indigo-700 px-3 py-2 text-sm hover:bg-indigo-600" [disabled]="registerForm.invalid">Guardar</button>
              <button type="button" class="w-full rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600" (click)="toggleRegisterUserForm()">Cerrar</button>
            </div>
          </form>
        }
      </header>

      <main class="mx-auto max-w-7xl p-4">
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
