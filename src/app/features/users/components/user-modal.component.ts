import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UserRole } from '../../../core/models/api.models';

export interface CreateUserPayload {
  username: string;
  password: string;
  role: UserRole;
}

@Component({
  selector: 'app-user-modal',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4 font-sans"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
          (click)="cancel.emit()"
        ></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-md scale-100 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="border-b border-white/5 bg-white/5 p-6 flex items-center justify-between">
            <h2 [id]="titleId" class="text-lg font-bold tracking-tight text-white flex items-center gap-2">
              <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400">
                <i class="fa-solid fa-user-plus text-sm"></i>
              </span>
              Create New User
            </h2>
            <button 
              type="button" 
              class="text-zinc-500 hover:text-zinc-300 transition-colors focus:outline-none"
              (click)="cancel.emit()"
            >
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>

          <!-- Body -->
          <div class="p-6">
            <form [formGroup]="form" (ngSubmit)="onSubmit()" class="space-y-4">
              
              <!-- Username -->
              <div class="space-y-1.5">
                <label for="username" class="text-xs font-medium text-zinc-400 ml-1">Username</label>
                <div class="relative">
                  <input
                    #usernameInput
                    id="username"
                    type="text"
                    formControlName="username"
                    placeholder="jdoe"
                    class="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500/50 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                    [class.border-red-500/50]="isFieldInvalid('username')"
                  />
                  @if (isFieldInvalid('username')) {
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">
                      Required
                    </div>
                  }
                </div>
              </div>
              
              <!-- Password -->
              <div class="space-y-1.5">
                <label for="password" class="text-xs font-medium text-zinc-400 ml-1">Password</label>
                <div class="relative">
                  <input
                    id="password"
                    type="password"
                    formControlName="password"
                    placeholder="••••••••"
                    class="w-full px-3 py-2.5 bg-black/20 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder-zinc-600 focus:border-violet-500/50 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500/20 transition-all"
                    [class.border-red-500/50]="isFieldInvalid('password')"
                  />
                  @if (isFieldInvalid('password')) {
                    <div class="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-xs">
                      Invalid
                    </div>
                  }
                </div>
                
                <!-- Password Requirements -->
                <div class="text-[10px] text-zinc-500 mt-2 space-y-1 ml-1 grid grid-cols-2 gap-x-2">
                  <p [class.text-green-400]="hasMinLength()" [class.text-zinc-600]="!hasMinLength()" class="transition-colors flex items-center">
                    @if (hasMinLength()) { <i class="fa-solid fa-check mr-1.5"></i> }
                    @else { <i class="fa-regular fa-circle mr-1.5"></i> }
                    8+ characters
                  </p>
                  <p [class.text-green-400]="hasUpper()" [class.text-zinc-600]="!hasUpper()" class="transition-colors flex items-center">
                    @if (hasUpper()) { <i class="fa-solid fa-check mr-1.5"></i> }
                    @else { <i class="fa-regular fa-circle mr-1.5"></i> }
                    Uppercase
                  </p>
                  <p [class.text-green-400]="hasLower()" [class.text-zinc-600]="!hasLower()" class="transition-colors flex items-center">
                    @if (hasLower()) { <i class="fa-solid fa-check mr-1.5"></i> }
                    @else { <i class="fa-regular fa-circle mr-1.5"></i> }
                    Lowercase
                  </p>
                  <p [class.text-green-400]="hasDigit()" [class.text-zinc-600]="!hasDigit()" class="transition-colors flex items-center">
                    @if (hasDigit()) { <i class="fa-solid fa-check mr-1.5"></i> }
                    @else { <i class="fa-regular fa-circle mr-1.5"></i> }
                    Number
                  </p>
                  <p [class.text-green-400]="hasSpecial()" [class.text-zinc-600]="!hasSpecial()" class="transition-colors flex items-center col-span-2">
                    @if (hasSpecial()) { <i class="fa-solid fa-check mr-1.5"></i> }
                    @else { <i class="fa-regular fa-circle mr-1.5"></i> }
                    Special character
                  </p>
                </div>
              </div>

              <!-- Role -->
              <div class="space-y-1.5">
                <label class="text-xs font-medium text-zinc-400 ml-1">Role</label>
                <div class="grid grid-cols-3 gap-2">
                  <label class="cursor-pointer relative">
                    <input type="radio" formControlName="role" value="viewer" class="peer sr-only">
                    <div class="text-center py-2.5 rounded-xl border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-violet-600/20 peer-checked:text-violet-300 peer-checked:border-violet-500/50 hover:bg-white/5 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-violet-500/40">
                      Viewer
                    </div>
                  </label>
                  <label class="cursor-pointer relative">
                    <input type="radio" formControlName="role" value="editor" class="peer sr-only">
                    <div class="text-center py-2.5 rounded-xl border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-blue-600/20 peer-checked:text-blue-300 peer-checked:border-blue-500/50 hover:bg-white/5 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-blue-500/40">
                      Editor
                    </div>
                  </label>
                  <label class="cursor-pointer relative">
                    <input type="radio" formControlName="role" value="admin" class="peer sr-only">
                    <div class="text-center py-2.5 rounded-xl border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-emerald-600/20 peer-checked:text-emerald-300 peer-checked:border-emerald-500/50 hover:bg-white/5 transition-all peer-focus-visible:ring-2 peer-focus-visible:ring-emerald-500/40">
                      Admin
                    </div>
                  </label>
                </div>
              </div>

              <!-- Actions -->
              <div class="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  class="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-200 active:scale-95 focus:outline-none focus:ring-2 focus:ring-zinc-500/20"
                  (click)="cancel.emit()"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed bg-violet-600 hover:bg-violet-500 shadow-violet-500/20 hover:shadow-violet-500/30 focus:outline-none focus:ring-2 focus:ring-violet-500/40"
                  [disabled]="form.invalid || loading()"
                >
                  @if (loading()) {
                    <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                  }
                  <span>{{ loading() ? 'Creating...' : 'Create User' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    }
  `,
})
export class UserModalComponent {
  private fb = inject(FormBuilder);

  readonly open = input(false);
  readonly loading = input(false);
  
  readonly confirm = output<CreateUserPayload>();
  readonly cancel = output<void>();

  readonly titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
  
  readonly form = this.fb.group({
    username: ['', [Validators.required, Validators.minLength(3)]],
    password: ['', [Validators.required, Validators.minLength(8)]],
    role: ['viewer' as UserRole, [Validators.required]],
  });

  private readonly usernameInputRef = viewChild<ElementRef<HTMLInputElement>>('usernameInput');

  get passwordControl() { return this.form.get('password'); }
  get passwordValue() { return this.passwordControl?.value || ''; }

  hasMinLength() { return this.passwordValue.length >= 8; }
  hasUpper() { return /[A-Z]/.test(this.passwordValue); }
  hasLower() { return /[a-z]/.test(this.passwordValue); }
  hasDigit() { return /\d/.test(this.passwordValue); }
  hasSpecial() { return /[!@#$%^&*(),.?":{}|<>]/.test(this.passwordValue) || /[^A-Za-z0-9]/.test(this.passwordValue); }

  constructor() {
    effect(() => {
      if (this.open()) {
        this.form.reset({ role: 'viewer' });
        // Focus username input when modal opens
        setTimeout(() => {
          this.usernameInputRef()?.nativeElement.focus();
        }, 50);
      }
    });
  }

  onSubmit(): void {
    if (this.form.valid) {
      this.confirm.emit(this.form.value as CreateUserPayload);
    } else {
      this.form.markAllAsTouched();
    }
  }

  onEscape(): void {
    if (this.open()) {
      this.cancel.emit();
    }
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.form.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
