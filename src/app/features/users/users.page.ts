import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { AuthApiService } from '../../core/api/auth-api.service';
import { UsersApiService } from '../../core/api/users-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { AuthUser, UserRole } from '../../core/models/api.models';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-3">
      <header class="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 class="text-2xl font-bold tracking-tight text-zinc-100">User Management</h1>
        <div class="flex items-center gap-2">
          <input
            type="text"
            [value]="searchText()"
            placeholder="Search users..."
            class="rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            (input)="onSearchInput($event)"
          />
          <button
            type="button"
            class="rounded-xl bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
            (click)="loadUsers()"
          >
            <i class="fa-solid fa-arrows-rotate mr-1.5 text-xs"></i>Refresh
          </button>
          <button
            type="button"
            class="rounded-xl bg-violet-600 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-500"
            (click)="toggleRegisterUserForm()"
          >
            <i class="fa-solid fa-user-plus mr-1.5 text-xs"></i>New User
          </button>
        </div>
      </header>

      <!-- Create New User Section -->
      @if (showRegisterForm()) {
        <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
          <div class="mb-3 flex items-center justify-between">
            <h2 class="text-sm font-semibold text-zinc-200">
              <i class="fa-solid fa-user-plus mr-1.5 text-xs text-violet-400"></i>Create New User
            </h2>
            <button type="button" class="text-zinc-400 hover:text-white transition-colors" (click)="toggleRegisterUserForm()">
              <i class="fa-solid fa-xmark text-lg"></i>
            </button>
          </div>
          <form class="grid gap-3 sm:grid-cols-4" [formGroup]="registerForm" (ngSubmit)="submitRegisterUser()">
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Username</label>
              <input
                type="text"
                formControlName="username"
                placeholder="Enter username"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-shadow"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Password</label>
              <input
                type="password"
                formControlName="password"
                placeholder="Enter password"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-shadow"
              />
            </div>
            <div>
              <label class="mb-1 block text-xs font-medium text-zinc-400">Role</label>
              <select
                formControlName="role"
                class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-shadow"
              >
                <option value="viewer">Viewer</option>
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div class="flex items-end">
              <button
                type="submit"
                class="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="registerForm.invalid || registeringUser()"
              >
                {{ registeringUser() ? 'Creating...' : 'Create User' }}
              </button>
            </div>
          </form>
        </section>
      }

      <!-- Change Password Section -->
      <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        <h2 class="mb-3 text-sm font-semibold text-zinc-200">
          <i class="fa-solid fa-key mr-1.5 text-xs text-violet-400"></i>Change My Password
        </h2>
        <form class="grid gap-3 sm:grid-cols-3" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-400">Current Password</label>
            <input
              type="password"
              formControlName="currentPassword"
              placeholder="Current password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-shadow"
            />
          </div>
          <div>
            <label class="mb-1 block text-xs font-medium text-zinc-400">New Password</label>
            <input
              type="password"
              formControlName="newPassword"
              placeholder="New password"
              class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500 transition-shadow"
            />
          </div>
          <div class="flex items-end">
            <button
              type="submit"
              class="w-full rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed"
              [disabled]="passwordForm.invalid || changingPassword()"
            >
              {{ changingPassword() ? 'Changing...' : 'Change Password' }}
            </button>
          </div>
        </form>
      </section>

      <!-- Users Table -->
      <section class="rounded-2xl border border-white/5 bg-zinc-900/40 p-5 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
        @if (loading()) {
          <p class="text-sm text-zinc-400">Loading users...</p>
        } @else if (filteredUsers().length === 0) {
          <p class="text-sm text-zinc-400">No users found.</p>
        } @else {
          <div class="overflow-auto">
            <table class="w-full text-left text-xs">
              <thead>
                <tr class="border-b border-zinc-800">
                  <th class="px-3 py-2 text-zinc-400 font-medium">Username</th>
                  <th class="px-3 py-2 text-zinc-400 font-medium">Role</th>
                  <th class="px-3 py-2 text-zinc-400 font-medium">ID</th>
                  <th class="px-3 py-2 text-zinc-400 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                @for (user of filteredUsers(); track user.id) {
                  <tr class="border-b border-zinc-800/50 hover:bg-white/[0.02] transition-colors">
                    <td class="px-3 py-2.5">
                      <div class="flex items-center gap-2">
                        <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-violet-600/20 text-violet-300 text-xs font-bold uppercase">
                          {{ user.username.charAt(0) }}
                        </div>
                        <span class="font-medium text-zinc-200">{{ user.username }}</span>
                        @if (user.id === currentUserId()) {
                          <span class="rounded bg-violet-900/50 px-1.5 py-0.5 text-[10px] text-violet-300 font-medium">you</span>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-2.5">
                      @if (editingUserId() === user.id) {
                        <select
                          [value]="editRole()"
                          class="rounded-lg border border-white/10 bg-white/5 px-2 py-1 text-xs text-white focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
                          (change)="onEditRoleChange($event)"
                        >
                          <option value="viewer">viewer</option>
                          <option value="editor">editor</option>
                          <option value="admin">admin</option>
                        </select>
                      } @else {
                        <span
                          class="inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium"
                          [class.bg-emerald-900/50]="user.role === 'admin'"
                          [class.text-emerald-300]="user.role === 'admin'"
                          [class.bg-blue-900/50]="user.role === 'editor'"
                          [class.text-blue-300]="user.role === 'editor'"
                          [class.bg-zinc-800]="user.role === 'viewer'"
                          [class.text-zinc-300]="user.role === 'viewer'"
                        >
                          {{ user.role }}
                        </span>
                      }
                    </td>
                    <td class="px-3 py-2.5 font-mono text-[11px] text-zinc-500">{{ user.id }}</td>
                    <td class="px-3 py-2.5 text-right">
                      <div class="flex items-center justify-end gap-1">
                        @if (editingUserId() === user.id) {
                          <button
                            type="button"
                            class="rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-medium text-white transition-all hover:bg-emerald-500 disabled:opacity-50"
                            [disabled]="savingUserId() === user.id"
                            (click)="saveRole(user)"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            class="rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-all hover:bg-white/20"
                            (click)="cancelEdit()"
                          >
                            Cancel
                          </button>
                        } @else {
                          <button
                            type="button"
                            class="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
                            [disabled]="user.id === currentUserId()"
                            (click)="startEdit(user)"
                          >
                            <i class="fa-solid fa-pen text-[10px]"></i>
                          </button>
                          <button
                            type="button"
                            class="rounded-lg bg-red-500/10 px-2.5 py-1 text-xs font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed"
                            [disabled]="user.id === currentUserId() || deletingUserId() === user.id"
                            (click)="deleteUser(user)"
                          >
                            <i class="fa-solid fa-trash text-[10px]"></i>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          <div class="mt-3 text-xs text-zinc-500">
            {{ filteredUsers().length }} user{{ filteredUsers().length !== 1 ? 's' : '' }}
          </div>
        }
      </section>
    </section>
  `,
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly feedback = inject(ErrorStoreService);

  readonly users = signal<AuthUser[]>([]);
  readonly loading = signal(false);
  readonly searchText = signal('');
  readonly editingUserId = signal<string | null>(null);
  readonly editRole = signal<UserRole>('viewer');
  readonly savingUserId = signal<string | null>(null);
  readonly deletingUserId = signal<string | null>(null);
  readonly changingPassword = signal(false);
  readonly showRegisterForm = signal(false);
  readonly registeringUser = signal(false);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? '');

  readonly filteredUsers = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    if (!query) {
      return this.users();
    }
    return this.users().filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
    );
  });

  readonly passwordForm = this.fb.nonNullable.group({
    currentPassword: ['', Validators.required],
    newPassword: ['', [Validators.required, Validators.minLength(4)]],
  });

  readonly registerForm = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
    role: this.fb.nonNullable.control<'viewer' | 'editor' | 'admin'>('viewer', Validators.required),
  });

  constructor() {
    this.loadUsers();
  }

  onSearchInput(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.searchText.set(input.value);
  }

  loadUsers(): void {
    this.loading.set(true);
    this.usersApi.list().subscribe({
      next: (users) => {
        this.users.set(users);
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      },
    });
  }

  startEdit(user: AuthUser): void {
    this.editingUserId.set(user.id);
    this.editRole.set(user.role);
  }

  cancelEdit(): void {
    this.editingUserId.set(null);
  }

  onEditRoleChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.editRole.set(select.value as UserRole);
  }

  saveRole(user: AuthUser): void {
    const newRole = this.editRole();
    if (newRole === user.role) {
      this.cancelEdit();
      return;
    }

    this.savingUserId.set(user.id);
    this.usersApi.update(user.id, { role: newRole }).subscribe({
      next: (updated) => {
        this.users.update((list) => list.map((u) => (u.id === updated.id ? updated : u)));
        this.feedback.success('USER', `Role of ${updated.username} changed to ${updated.role}.`);
        this.savingUserId.set(null);
        this.editingUserId.set(null);
      },
      error: () => {
        this.savingUserId.set(null);
      },
    });
  }

  deleteUser(user: AuthUser): void {
    if (!confirm(`Are you sure you want to delete user "${user.username}"?`)) {
      return;
    }

    this.deletingUserId.set(user.id);
    this.usersApi.delete(user.id).subscribe({
      next: () => {
        this.users.update((list) => list.filter((u) => u.id !== user.id));
        this.feedback.success('USER', `User ${user.username} deleted.`);
        this.deletingUserId.set(null);
      },
      error: () => {
        this.deletingUserId.set(null);
      },
    });
  }

  changePassword(): void {
    if (this.passwordForm.invalid) {
      return;
    }

    const { currentPassword, newPassword } = this.passwordForm.getRawValue();
    this.changingPassword.set(true);

    this.authApi.changePassword({ current_password: currentPassword, new_password: newPassword }).subscribe({
      next: () => {
        this.feedback.success('PASSWORD', 'Password changed successfully.');
        this.passwordForm.reset();
        this.changingPassword.set(false);
      },
      error: () => {
        this.changingPassword.set(false);
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

    this.registeringUser.set(true);
    const payload = this.registerForm.getRawValue();
    this.authApi.register(payload).subscribe({
      next: () => {
        this.feedback.success('REGISTER', `Usuario ${payload.username} creado con rol ${payload.role}.`);
        this.registerForm.reset({ username: '', password: '', role: 'viewer' });
        this.showRegisterForm.set(false);
        this.registeringUser.set(false);
        this.loadUsers();
      },
      error: () => {
        this.registeringUser.set(false);
      },
    });
  }
}
