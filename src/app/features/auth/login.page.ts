import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStoreService } from '../../core/auth/auth-store.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      <!-- Background effects -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-900/20 via-zinc-950 to-zinc-950"></div>
      
      <section class="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 hover:shadow-violet-900/10">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-violet-500/10 text-violet-400 ring-1 ring-violet-500/20 shadow-[0_0_15px_-3px_rgba(139,92,246,0.3)]">
            <i class="fa-solid fa-folder-open text-2xl"></i>
          </div>
          <h1 class="text-3xl font-bold tracking-tight text-white">File Explorer</h1>
          <p class="mt-2 text-sm text-zinc-400">Inicia sesión para acceder a tus archivos.</p>
        </div>

        <form class="space-y-6" [formGroup]="form" (ngSubmit)="submit()">
          <!-- Username Field -->
          <div>
            <label class="mb-2 block text-sm font-medium text-zinc-300" for="username">Usuario</label>
            <div class="relative group">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 transition-colors group-focus-within:text-violet-400">
                <i class="fa-solid fa-user"></i>
              </div>
              <input
                id="username"
                type="text"
                formControlName="username"
                placeholder="Ingresa tu usuario"
                [attr.disabled]="loading() ? true : null"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <!-- Password Field -->
          <div>
            <label class="mb-2 block text-sm font-medium text-zinc-300" for="password">Contraseña</label>
            <div class="relative group">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 transition-colors group-focus-within:text-violet-400">
                <i class="fa-solid fa-lock"></i>
              </div>
              <input
                id="password"
                [type]="showPassword() ? 'text' : 'password'"
                formControlName="password"
                placeholder="••••••••"
                [attr.disabled]="loading() ? true : null"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-violet-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility()"
                [disabled]="loading()"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50 transition-colors"
                [attr.aria-label]="showPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <i class="fa-solid" [class.fa-eye]="!showPassword()" [class.fa-eye-slash]="showPassword()"></i>
              </button>
            </div>
          </div>

          <!-- Remember Me -->
          <div class="flex items-center justify-between">
            <div class="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                formControlName="rememberMe"
                class="h-4 w-4 rounded border-zinc-700 bg-zinc-800 text-violet-600 focus:ring-violet-500/50 focus:ring-offset-zinc-900"
              />
              <label for="remember-me" class="ml-2 block text-sm text-zinc-400 select-none cursor-pointer hover:text-zinc-300 transition-colors">Recordarme</label>
            </div>
            <!-- Forgot password link could go here -->
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-2 duration-200">
              <i class="fa-solid fa-circle-exclamation shrink-0"></i>
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="group relative flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-500/20 transition-all hover:bg-violet-500 hover:shadow-violet-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            @if (loading()) {
              <i class="fa-solid fa-circle-notch animate-spin mr-2"></i>
              <span>Entrando...</span>
            } @else {
              <span>Entrar</span>
              <i class="fa-solid fa-arrow-right ml-2 transition-transform group-hover:translate-x-1"></i>
            }
          </button>
        </form>
      </section>
      
      <!-- Footer -->
      <footer class="absolute bottom-4 text-center text-xs text-zinc-600">
        &copy; {{ currentYear }} File Explorer. All rights reserved.
      </footer>
    </div>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly showPassword = signal(false);
  
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
    rememberMe: [false],
  });

  constructor() {
    // Load saved username if exists
    const savedUsername = localStorage.getItem('file-explorer.username');
    if (savedUsername) {
      this.form.patchValue({ username: savedUsername, rememberMe: true });
    }
  }

  togglePasswordVisibility(): void {
    this.showPassword.update((v) => !v);
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    const { username, password, rememberMe } = this.form.getRawValue();

    // Handle "Remember Me"
    if (rememberMe) {
      localStorage.setItem('file-explorer.username', username);
    } else {
      localStorage.removeItem('file-explorer.username');
    }

    this.authStore.login({ username, password }).subscribe({
      next: () => {
        this.loading.set(false);

        if (this.authStore.forcePasswordChange()) {
          void this.router.navigate(['/auth/force-change-password']);
        } else {
          void this.router.navigate(['/explorer']);
        }
      },
      error: (error: { error?: { error?: { message?: string } } }) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.error?.message ?? 'No fue posible iniciar sesión.');
      },
    });
  }
}
