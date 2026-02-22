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
    <div class="flex min-h-screen items-center justify-center bg-zinc-950 p-4 font-sans">
      <!-- Background effects -->
      <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-amber-900/20 via-zinc-950 to-zinc-950"></div>

      <section class="relative w-full max-w-md overflow-hidden rounded-3xl border border-white/5 bg-zinc-900/40 p-8 shadow-2xl backdrop-blur-2xl ring-1 ring-white/5 transition-all duration-300 hover:shadow-amber-900/10">
        <!-- Header -->
        <div class="mb-8 text-center">
          <div class="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 ring-1 ring-amber-500/20 shadow-[0_0_15px_-3px_rgba(245,158,11,0.3)]">
            <i class="fa-solid fa-key text-2xl"></i>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-white">Cambio de contraseña requerido</h1>
          <p class="mt-2 text-sm text-zinc-400">
            Tu cuenta requiere un cambio de contraseña antes de continuar.
          </p>
        </div>

        <form class="space-y-6" [formGroup]="form" (ngSubmit)="submit()">
          <!-- Current Password -->
          <div>
            <label class="mb-2 block text-sm font-medium text-zinc-300" for="currentPassword">Contraseña actual</label>
            <div class="relative group">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 transition-colors group-focus-within:text-amber-500">
                <i class="fa-solid fa-lock"></i>
              </div>
              <input
                id="currentPassword"
                [type]="showCurrentPassword() ? 'text' : 'password'"
                formControlName="currentPassword"
                placeholder="••••••••"
                [attr.disabled]="loading() ? true : null"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                (click)="toggleCurrentPassword()"
                [disabled]="loading()"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50 transition-colors"
                [attr.aria-label]="showCurrentPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <i class="fa-solid" [class.fa-eye]="!showCurrentPassword()" [class.fa-eye-slash]="showCurrentPassword()"></i>
              </button>
            </div>
          </div>

          <!-- New Password -->
          <div>
            <label class="mb-2 block text-sm font-medium text-zinc-300" for="newPassword">Nueva contraseña</label>
            <div class="relative group">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 transition-colors group-focus-within:text-amber-500">
                <i class="fa-solid fa-key"></i>
              </div>
              <input
                id="newPassword"
                [type]="showNewPassword() ? 'text' : 'password'"
                formControlName="newPassword"
                placeholder="••••••••"
                [attr.disabled]="loading() ? true : null"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                (click)="toggleNewPassword()"
                [disabled]="loading()"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50 transition-colors"
                [attr.aria-label]="showNewPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <i class="fa-solid" [class.fa-eye]="!showNewPassword()" [class.fa-eye-slash]="showNewPassword()"></i>
              </button>
            </div>
            
            <!-- Password Strength -->
            @if (form.controls.newPassword.touched && form.controls.newPassword.errors?.['passwordStrength']) {
              <div class="mt-3 rounded-lg bg-zinc-900/50 p-3 border border-white/5 animate-in fade-in slide-in-from-top-1">
                <p class="mb-2 text-xs font-medium text-zinc-400">Requisitos de contraseña:</p>
                <ul class="space-y-1">
                  @for (req of form.controls.newPassword.errors?.['passwordStrength']; track req) {
                    <li class="flex items-center text-xs text-amber-500/90">
                      <i class="fa-solid fa-circle-xmark mr-1.5 text-[10px]"></i>
                      <span>{{ req }}</span>
                    </li>
                  }
                </ul>
              </div>
            }
          </div>

          <!-- Confirm Password -->
          <div>
            <label class="mb-2 block text-sm font-medium text-zinc-300" for="confirmPassword">Confirmar nueva contraseña</label>
            <div class="relative group">
              <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-500 transition-colors group-focus-within:text-amber-500">
                <i class="fa-solid fa-check-double"></i>
              </div>
              <input
                id="confirmPassword"
                [type]="showConfirmPassword() ? 'text' : 'password'"
                formControlName="confirmPassword"
                placeholder="••••••••"
                [attr.disabled]="loading() ? true : null"
                class="block w-full rounded-xl border border-white/10 bg-white/5 py-3 pl-10 pr-10 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-amber-500/50 focus:bg-white/10 focus:outline-none focus:ring-2 focus:ring-amber-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                type="button"
                (click)="toggleConfirmPassword()"
                [disabled]="loading()"
                class="absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-500 hover:text-zinc-300 focus:outline-none disabled:opacity-50 transition-colors"
                [attr.aria-label]="showConfirmPassword() ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <i class="fa-solid" [class.fa-eye]="!showConfirmPassword()" [class.fa-eye-slash]="showConfirmPassword()"></i>
              </button>
            </div>
            @if (form.controls.confirmPassword.touched && form.hasError('passwordMismatch')) {
              <div class="mt-2 flex items-center gap-2 text-xs text-red-400 animate-in fade-in">
                <i class="fa-solid fa-triangle-exclamation"></i>
                <p>Las contraseñas no coinciden.</p>
              </div>
            }
          </div>

          <!-- Error Message -->
          @if (errorMessage()) {
            <div class="flex items-center gap-3 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400 animate-in fade-in slide-in-from-top-2">
              <i class="fa-solid fa-circle-exclamation shrink-0"></i>
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <!-- Success Message -->
          @if (successMessage()) {
            <div class="flex items-center gap-3 rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-sm text-green-400 animate-in fade-in slide-in-from-top-2">
              <i class="fa-solid fa-circle-check shrink-0"></i>
              <p>{{ successMessage() }}</p>
            </div>
          }

          <!-- Submit Button -->
          <button
            type="submit"
            [disabled]="form.invalid || loading()"
            class="group relative flex w-full items-center justify-center rounded-xl bg-amber-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-amber-500/20 transition-all hover:bg-amber-500 hover:shadow-amber-500/30 hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-none"
          >
            @if (loading()) {
              <i class="fa-solid fa-circle-notch animate-spin mr-2"></i>
              <span>Cambiando...</span>
            } @else {
              <span>Cambiar contraseña</span>
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
export class ForceChangePasswordPage {
  private readonly fb = inject(FormBuilder);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly router = inject(Router);

  readonly loading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  
  readonly showCurrentPassword = signal(false);
  readonly showNewPassword = signal(false);
  readonly showConfirmPassword = signal(false);
  
  readonly currentYear = new Date().getFullYear();

  readonly form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, passwordStrengthValidator]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: [this.passwordMatchValidator] }
  );

  toggleCurrentPassword(): void {
    this.showCurrentPassword.update((v) => !v);
  }

  toggleNewPassword(): void {
    this.showNewPassword.update((v) => !v);
  }

  toggleConfirmPassword(): void {
    this.showConfirmPassword.update((v) => !v);
  }

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
