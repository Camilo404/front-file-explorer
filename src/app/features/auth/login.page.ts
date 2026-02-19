import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthStoreService } from '../../core/auth/auth-store.service';

@Component({
  selector: 'app-login-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="mx-auto mt-16 w-full max-w-md rounded border border-slate-800 bg-slate-900 p-6">
      <h1 class="text-xl font-semibold">File Explorer Login</h1>
      <p class="mt-1 text-sm text-slate-400">Inicia sesión para acceder al explorador.</p>

      <form class="mt-6 space-y-4" [formGroup]="form" (ngSubmit)="submit()">
        <label class="block text-sm">
          <span class="mb-1 block text-slate-300">Username</span>
          <input
            type="text"
            formControlName="username"
            class="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>

        <label class="block text-sm">
          <span class="mb-1 block text-slate-300">Password</span>
          <input
            type="password"
            formControlName="password"
            class="w-full rounded border border-slate-700 bg-slate-950 px-3 py-2"
          />
        </label>

        @if (errorMessage()) {
          <p class="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm text-red-200">
            {{ errorMessage() }}
          </p>
        }

        <button
          type="submit"
          [disabled]="form.invalid || loading()"
          class="w-full rounded bg-blue-600 px-3 py-2 text-sm font-medium hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          @if (loading()) {
            Entrando...
          } @else {
            Entrar
          }
        </button>
      </form>
    </section>
  `,
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');

  readonly form = this.fb.nonNullable.group({
    username: ['', [Validators.required]],
    password: ['', [Validators.required]],
  });

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');

    this.authStore.login(this.form.getRawValue()).subscribe({
      next: () => {
        this.loading.set(false);
        void this.router.navigate(['/explorer']);
      },
      error: (error: { error?: { error?: { message?: string } } }) => {
        this.loading.set(false);
        this.errorMessage.set(error.error?.error?.message ?? 'No fue posible iniciar sesión.');
      },
    });
  }
}
