import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthApiService } from '../../core/api/auth-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';

const passwordStrengthValidator: ValidatorFn = (control: AbstractControl): ValidationErrors | null => {
  const value: string = control.value ?? '';
  if (!value) {
    return null; // let required handle empty
  }

  const errors: string[] = [];
  if (value.length < 8) errors.push('al menos 8 caracteres');
  if (!/[A-Z]/.test(value)) errors.push('una mayúscula');
  if (!/[a-z]/.test(value)) errors.push('una minúscula');
  if (!/[0-9]/.test(value)) errors.push('un número');
  if (!/[^A-Za-z0-9]/.test(value)) errors.push('un carácter especial');

  return errors.length ? { passwordStrength: errors } : null;
};

@Component({
  selector: 'app-force-change-password-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex min-h-screen items-center justify-center bg-zinc-950 p-4">
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950"></div>

      <section class="relative w-full max-w-md rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5">
        <div class="mb-8 text-center">
          <div class="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="h-8 w-8">
              <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
            </svg>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Cambio de contraseña requerido</h1>
          <p class="mt-2 text-sm text-zinc-400">
            Tu cuenta requiere un cambio de contraseña antes de continuar.
          </p>
        </div>

        <form class="space-y-5" [formGroup]="form" (ngSubmit)="submit()">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-zinc-300">Contraseña actual</label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                  <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                formControlName="currentPassword"
                placeholder="••••••••"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-zinc-300">Nueva contraseña</label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                  <path fill-rule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                formControlName="newPassword"
                placeholder="••••••••"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            @if (form.controls.newPassword.touched && form.controls.newPassword.errors?.['passwordStrength']) {
              <div class="mt-2 space-y-1">
                <p class="text-xs text-zinc-500">La contraseña debe contener:</p>
                @for (req of form.controls.newPassword.errors?.['passwordStrength']; track req) {
                  <p class="text-xs text-amber-400">• {{ req }}</p>
                }
              </div>
            }
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-zinc-300">Confirmar nueva contraseña</label>
            <div class="relative">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                  <path fill-rule="evenodd" d="M8 7a5 5 0 113.61 4.804l-1.903 1.903A1 1 0 019 14H8v1a1 1 0 01-1 1H6v1a1 1 0 01-1 1H3a1 1 0 01-1-1v-2a1 1 0 01.293-.707L8.196 8.39A5.002 5.002 0 018 7zm5-3a.75.75 0 000 1.5A1.5 1.5 0 0114.5 7 .75.75 0 0016 7a3 3 0 00-3-3z" clip-rule="evenodd" />
                </svg>
              </div>
              <input
                type="password"
                formControlName="confirmPassword"
                placeholder="••••••••"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-2.5 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
              />
            </div>
            @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
              <p class="mt-1.5 text-xs text-red-400">Las contraseñas no coinciden.</p>
            }
          </div>

          @if (errorMessage()) {
            <div class="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 shrink-0">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
              </svg>
              <p>{{ errorMessage() }}</p>
            </div>
          }

          @if (successMessage()) {
            <div class="flex items-center gap-2 rounded-lg border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-400">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5 shrink-0">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
              </svg>
              <p>{{ successMessage() }}</p>
            </div>
          }

          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="group relative flex w-full justify-center rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50"
          >
            @if (loading()) {
              <svg class="mr-2 h-5 w-5 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Cambiando...
            } @else {
              Cambiar contraseña
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" />
              </svg>
            }
          </button>
        </form>
      </section>
    </div>
  `,
})
export class ForceChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator] }
  );

  private passwordMatchValidator(group: AbstractControl): ValidationErrors | null {
    const newPassword = group.get('newPassword')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { passwordMismatch: true };
  }

  submit(): void {
    if (this.form.invalid || this.loading()) {
      return;
    }

    this.loading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const { currentPassword, newPassword } = this.form.getRawValue();

    this.authApi
      .changePassword({ current_password: currentPassword, new_password: newPassword })
      .subscribe({
        next: () => {
          this.loading.set(false);
          this.successMessage.set('Contraseña cambiada exitosamente. Redirigiendo...');
          this.authStore.clearForcePasswordChange();

          // The backend revokes all refresh tokens on password change,
          // so we clear the session and redirect to login.
          setTimeout(() => {
            this.authStore.clearSession();
          }, 1500);
        },
        error: (error: { error?: { error?: { message?: string } } }) => {
          this.loading.set(false);
          this.errorMessage.set(error.error?.error?.message ?? 'No fue posible cambiar la contraseña.');
        },
      });
  }
}
