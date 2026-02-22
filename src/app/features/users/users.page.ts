import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { AuthApiService } from '../../core/api/auth-api.service';
import { UsersApiService } from '../../core/api/users-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { AuthUser, UserRole } from '../../core/models/api.models';

type SortColumn = 'username' | 'role' | 'id';
type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-users-page',
  imports: [ReactiveFormsModule, CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="space-y-6 p-4 md:p-6 max-w-7xl mx-auto">
      <!-- Header Section -->
      <header class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 class="text-3xl font-bold tracking-tight text-white">User Management</h1>
          <p class="text-zinc-400 text-sm mt-1">Manage system access and user roles</p>
        </div>
        
        <div class="flex flex-col sm:flex-row gap-3">
          <div class="relative group">
            <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <i class="fa-solid fa-search text-zinc-500 group-focus-within:text-violet-400 transition-colors"></i>
            </div>
            <input
              type="text"
              [value]="searchText()"
              placeholder="Search users..."
              class="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-zinc-900/50 border border-white/10 rounded-xl text-sm text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-violet-500/50 focus:ring-1 focus:ring-violet-500/50 transition-all shadow-sm"
              (input)="onSearchInput($event)"
            />
          </div>
          
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 text-zinc-300 hover:bg-zinc-700 hover:text-white transition-all font-medium text-sm border border-white/5"
            (click)="loadUsers()"
            title="Refresh list"
          >
            <i class="fa-solid fa-rotate" [class.fa-spin]="loading()"></i>
            <span class="hidden sm:inline">Refresh</span>
          </button>
          
          <button
            type="button"
            class="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-violet-600 text-white hover:bg-violet-500 transition-all font-medium text-sm shadow-lg shadow-violet-900/20"
            (click)="toggleRegisterUserForm()"
          >
            <i class="fa-solid fa-user-plus"></i>
            <span>New User</span>
          </button>
        </div>
      </header>

      <!-- Forms Area (Grid Layout) -->
      @if (showRegisterForm() || showPasswordForm()) {
        <div class="grid gap-6 lg:grid-cols-2">
          
          <!-- Create New User Form -->
          @if (showRegisterForm()) {
            <section class="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
              <div class="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h2 class="font-semibold text-zinc-100 flex items-center gap-2">
                  <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-violet-500/10 text-violet-400">
                    <i class="fa-solid fa-user-plus text-sm"></i>
                  </span>
                  Create New User
                </h2>
                <button type="button" class="text-zinc-500 hover:text-zinc-300 transition-colors" (click)="toggleRegisterUserForm()">
                  <i class="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>
              
              <div class="p-5">
                <form class="space-y-4" [formGroup]="registerForm" (ngSubmit)="submitRegisterUser()">
                  <div class="grid gap-4 sm:grid-cols-2">
                    <div class="space-y-1.5">
                      <label class="text-xs font-medium text-zinc-400 ml-1">Username</label>
                      <input
                        type="text"
                        formControlName="username"
                        placeholder="jdoe"
                        class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
                      />
                    </div>
                    
                    <div class="space-y-1.5">
                      <label class="text-xs font-medium text-zinc-400 ml-1">Password</label>
                      <input
                        type="password"
                        formControlName="password"
                        placeholder="••••••••"
                        class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
                      />
                    </div>
                  </div>

                  <div class="space-y-1.5">
                    <label class="text-xs font-medium text-zinc-400 ml-1">Role</label>
                    <div class="grid grid-cols-3 gap-2">
                      <label class="cursor-pointer relative">
                        <input type="radio" formControlName="role" value="viewer" class="peer sr-only">
                        <div class="text-center py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-violet-600/20 peer-checked:text-violet-300 peer-checked:border-violet-500/50 hover:bg-white/5 transition-all">
                          Viewer
                        </div>
                      </label>
                      <label class="cursor-pointer relative">
                        <input type="radio" formControlName="role" value="editor" class="peer sr-only">
                        <div class="text-center py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-blue-600/20 peer-checked:text-blue-300 peer-checked:border-blue-500/50 hover:bg-white/5 transition-all">
                          Editor
                        </div>
                      </label>
                      <label class="cursor-pointer relative">
                        <input type="radio" formControlName="role" value="admin" class="peer sr-only">
                        <div class="text-center py-2 rounded-lg border border-white/10 bg-black/20 text-zinc-400 text-sm peer-checked:bg-emerald-600/20 peer-checked:text-emerald-300 peer-checked:border-emerald-500/50 hover:bg-white/5 transition-all">
                          Admin
                        </div>
                      </label>
                    </div>
                  </div>

                  <div class="pt-2 flex justify-end">
                    <button
                      type="submit"
                      class="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      [disabled]="registerForm.invalid || registeringUser()"
                    >
                      @if (registeringUser()) {
                        <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                      }
                      {{ registeringUser() ? 'Creating...' : 'Create User' }}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          }

          <!-- Change Password Form -->
          @if (showPasswordForm()) {
            <section class="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl">
               <div class="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-white/2">
                <h2 class="font-semibold text-zinc-100 flex items-center gap-2">
                  <span class="flex items-center justify-center w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400">
                    <i class="fa-solid fa-key text-sm"></i>
                  </span>
                  Change My Password
                </h2>
                <button type="button" class="text-zinc-500 hover:text-zinc-300 transition-colors" (click)="togglePasswordForm()">
                  <i class="fa-solid fa-xmark text-lg"></i>
                </button>
              </div>

              <div class="p-5">
                <form class="space-y-4" [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                  <div class="space-y-1.5">
                    <label class="text-xs font-medium text-zinc-400 ml-1">Current Password</label>
                    <input
                      type="password"
                      formControlName="currentPassword"
                      placeholder="••••••••"
                      class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
                    />
                  </div>
                  
                  <div class="space-y-1.5">
                    <label class="text-xs font-medium text-zinc-400 ml-1">New Password</label>
                    <input
                      type="password"
                      formControlName="newPassword"
                      placeholder="••••••••"
                      class="w-full px-3 py-2 bg-black/20 border border-white/10 rounded-lg text-sm text-zinc-200 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all"
                    />
                  </div>

                  <div class="pt-2 flex justify-end">
                    <button
                      type="submit"
                      class="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white text-sm font-medium rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      [disabled]="passwordForm.invalid || changingPassword()"
                    >
                      @if (changingPassword()) {
                        <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                      }
                      {{ changingPassword() ? 'Updating...' : 'Update Password' }}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          }
        </div>
      }

      <!-- Users Table Section -->
      <section class="bg-zinc-900/40 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-xl flex flex-col min-h-[500px]">
        <!-- Toolbar -->
        <div class="px-5 py-3 border-b border-white/5 flex flex-wrap items-center justify-between gap-4 bg-white/2">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-zinc-400">Total Users:</span>
            <span class="px-2 py-0.5 rounded-full bg-white/5 text-xs font-bold text-zinc-200">{{ filteredCount() }}</span>
          </div>
          
          <div class="flex items-center gap-3">
             @if (!showPasswordForm()) {
               <button
                type="button"
                class="text-xs font-medium text-zinc-400 hover:text-white transition-colors flex items-center gap-1.5"
                (click)="togglePasswordForm()"
              >
                <i class="fa-solid fa-key"></i> Change Password
              </button>
             }
            <div class="h-4 w-px bg-white/10"></div>
             <select 
              [ngModel]="pageSize()" 
              (ngModelChange)="pageSize.set($event); currentPage.set(1)"
              class="bg-black/20 border border-white/10 rounded-lg text-xs text-zinc-300 px-2 py-1 focus:outline-none focus:border-violet-500"
            >
              <option [value]="5">5 per page</option>
              <option [value]="10">10 per page</option>
              <option [value]="25">25 per page</option>
              <option [value]="50">50 per page</option>
            </select>
          </div>
        </div>

        <!-- Table -->
        <div class="flex-1 overflow-auto relative">
          @if (loading() && users().length === 0) {
            <div class="absolute inset-0 flex items-center justify-center bg-zinc-900/50 backdrop-blur-sm z-10">
              <div class="flex flex-col items-center gap-3">
                <i class="fa-solid fa-circle-notch fa-spin text-3xl text-violet-500"></i>
                <p class="text-sm text-zinc-400">Loading users...</p>
              </div>
            </div>
          }

          <table class="w-full text-left border-collapse">
            <thead class="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md shadow-sm">
              <tr class="text-xs uppercase tracking-wider text-zinc-500">
                <th 
                  class="px-5 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors group select-none"
                  (click)="toggleSort('username')"
                >
                  <div class="flex items-center gap-1.5">
                    User
                    <span class="flex flex-col text-[8px] leading-[3px] opacity-30 group-hover:opacity-100 transition-opacity" 
                          [class.opacity-100]="sortColumn() === 'username'">
                      <i class="fa-solid fa-caret-up" [class.text-violet-400]="sortColumn() === 'username' && sortDirection() === 'asc'"></i>
                      <i class="fa-solid fa-caret-down" [class.text-violet-400]="sortColumn() === 'username' && sortDirection() === 'desc'"></i>
                    </span>
                  </div>
                </th>
                <th 
                  class="px-5 py-3 font-medium cursor-pointer hover:text-zinc-300 transition-colors group select-none"
                  (click)="toggleSort('role')"
                >
                  <div class="flex items-center gap-1.5">
                    Role
                    <span class="flex flex-col text-[8px] leading-[3px] opacity-30 group-hover:opacity-100 transition-opacity"
                          [class.opacity-100]="sortColumn() === 'role'">
                      <i class="fa-solid fa-caret-up" [class.text-violet-400]="sortColumn() === 'role' && sortDirection() === 'asc'"></i>
                      <i class="fa-solid fa-caret-down" [class.text-violet-400]="sortColumn() === 'role' && sortDirection() === 'desc'"></i>
                    </span>
                  </div>
                </th>
                <th class="px-5 py-3 font-medium hidden sm:table-cell">ID</th>
                <th class="px-5 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @if (paginatedUsers().length === 0 && !loading()) {
                <tr>
                  <td colspan="4" class="px-5 py-12 text-center text-zinc-500">
                    <div class="flex flex-col items-center gap-2">
                      <i class="fa-regular fa-folder-open text-2xl opacity-50"></i>
                      <p>No users found matching your search.</p>
                    </div>
                  </td>
                </tr>
              }

              @for (user of paginatedUsers(); track user.id) {
                <tr class="group hover:bg-white/2 transition-colors">
                  <td class="px-5 py-3">
                    <div class="flex items-center gap-3">
                      <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-violet-600/20 to-indigo-600/20 text-violet-300 text-sm font-bold uppercase ring-1 ring-white/10 shadow-sm">
                        {{ user.username.charAt(0) }}
                      </div>
                      <div class="flex flex-col">
                        <div class="flex items-center gap-2">
                          <span class="font-medium text-zinc-200 text-sm group-hover:text-white transition-colors">{{ user.username }}</span>
                          @if (user.id === currentUserId()) {
                            <span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-violet-500/20 text-violet-300 border border-violet-500/20">YOU</span>
                          }
                        </div>
                      </div>
                    </div>
                  </td>
                  <td class="px-5 py-3">
                    @if (editingUserId() === user.id) {
                      <select
                        [value]="editRole()"
                        class="bg-black/40 border border-violet-500/50 rounded-md text-xs text-white py-1 pl-2 pr-6 focus:outline-none focus:ring-1 focus:ring-violet-500"
                        (change)="onEditRoleChange($event)"
                      >
                        <option value="viewer">Viewer</option>
                        <option value="editor">Editor</option>
                        <option value="admin">Admin</option>
                      </select>
                    } @else {
                      <span
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border"
                        [class.bg-emerald-500/10]="user.role === 'admin'"
                        [class.text-emerald-400]="user.role === 'admin'"
                        [class.border-emerald-500/20]="user.role === 'admin'"
                        [class.bg-blue-500/10]="user.role === 'editor'"
                        [class.text-blue-400]="user.role === 'editor'"
                        [class.border-blue-500/20]="user.role === 'editor'"
                        [class.bg-zinc-500/10]="user.role === 'viewer'"
                        [class.text-zinc-400]="user.role === 'viewer'"
                        [class.border-zinc-500/20]="user.role === 'viewer'"
                      >
                        <span class="w-1.5 h-1.5 rounded-full"
                          [class.bg-emerald-400]="user.role === 'admin'"
                          [class.bg-blue-400]="user.role === 'editor'"
                          [class.bg-zinc-400]="user.role === 'viewer'"
                        ></span>
                        {{ user.role | titlecase }}
                      </span>
                    }
                  </td>
                  <td class="px-5 py-3 hidden sm:table-cell">
                    <span class="font-mono text-[10px] text-zinc-600 select-all">{{ user.id }}</span>
                  </td>
                  <td class="px-5 py-3 text-right">
                    <div class="flex items-center justify-end gap-2">
                      @if (editingUserId() === user.id) {
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400 transition-colors hover:bg-emerald-500 hover:text-white"
                          title="Save"
                          [disabled]="savingUserId() === user.id"
                          (click)="saveRole(user)"
                        >
                          <i class="fa-solid fa-check text-xs"></i>
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
                          title="Cancel"
                          (click)="cancelEdit()"
                        >
                          <i class="fa-solid fa-xmark text-xs"></i>
                        </button>
                      } @else {
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-violet-500 hover:text-white"
                          title="Edit Role"
                          [disabled]="user.id === currentUserId()"
                          [class.invisible]="user.id === currentUserId()"
                          (click)="startEdit(user)"
                        >
                          <i class="fa-solid fa-pen text-xs"></i>
                        </button>
                        <button
                          type="button"
                          class="inline-flex h-7 w-7 items-center justify-center rounded-lg bg-white/5 text-zinc-400 transition-colors hover:bg-red-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                          title="Delete User"
                          [disabled]="user.id === currentUserId() || deletingUserId() === user.id"
                          [class.invisible]="user.id === currentUserId()"
                          (click)="deleteUser(user)"
                        >
                          @if (deletingUserId() === user.id) {
                            <i class="fa-solid fa-circle-notch fa-spin text-xs"></i>
                          } @else {
                            <i class="fa-solid fa-trash text-xs"></i>
                          }
                        </button>
                      }
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-5 py-3 border-t border-white/5 flex items-center justify-between bg-white/2" *ngIf="totalPages() > 1">
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            [disabled]="currentPage() === 1"
            (click)="changePage(-1)"
          >
            Previous
          </button>
          
          <div class="text-xs text-zinc-500">
            Page <span class="text-zinc-300 font-medium">{{ currentPage() }}</span> of <span class="text-zinc-300 font-medium">{{ totalPages() }}</span>
          </div>
          
          <button
            type="button"
            class="px-3 py-1.5 rounded-lg bg-white/5 text-xs font-medium text-zinc-300 hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            [disabled]="currentPage() === totalPages()"
            (click)="changePage(1)"
          >
            Next
          </button>
        </div>
      </section>
    </section>
  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow-y: auto;
    }
  `]
})
export class UsersPage {
  private readonly fb = inject(FormBuilder);
  private readonly usersApi = inject(UsersApiService);
  private readonly authApi = inject(AuthApiService);
  private readonly authStore = inject(AuthStoreService);
  private readonly feedback = inject(ErrorStoreService);

  // Data Signals
  readonly users = signal<AuthUser[]>([]);
  readonly loading = signal(false);
  
  // Filter & Sort Signals
  readonly searchText = signal('');
  readonly sortColumn = signal<SortColumn>('username');
  readonly sortDirection = signal<SortDirection>('asc');
  readonly pageSize = signal(10);
  readonly currentPage = signal(1);

  // Action State Signals
  readonly editingUserId = signal<string | null>(null);
  readonly editRole = signal<UserRole>('viewer');
  readonly savingUserId = signal<string | null>(null);
  readonly deletingUserId = signal<string | null>(null);
  readonly changingPassword = signal(false);
  readonly showRegisterForm = signal(false);
  readonly showPasswordForm = signal(false);
  readonly registeringUser = signal(false);

  readonly currentUserId = computed(() => this.authStore.user()?.id ?? '');

  // Derived State
  readonly filteredUsers = computed(() => {
    const query = this.searchText().trim().toLowerCase();
    const list = this.users();
    
    if (!query) return list;
    
    return list.filter(
      (u) =>
        u.username.toLowerCase().includes(query) ||
        u.role.toLowerCase().includes(query) ||
        u.id.toLowerCase().includes(query)
    );
  });

  readonly sortedUsers = computed(() => {
    const list = [...this.filteredUsers()];
    const column = this.sortColumn();
    const direction = this.sortDirection();
    
    return list.sort((a, b) => {
      const valA = a[column].toLowerCase();
      const valB = b[column].toLowerCase();
      
      if (valA < valB) return direction === 'asc' ? -1 : 1;
      if (valA > valB) return direction === 'asc' ? 1 : -1;
      return 0;
    });
  });

  readonly filteredCount = computed(() => this.filteredUsers().length);
  readonly totalPages = computed(() => Math.ceil(this.filteredCount() / this.pageSize()));

  readonly paginatedUsers = computed(() => {
    const page = this.currentPage();
    const size = this.pageSize();
    const start = (page - 1) * size;
    return this.sortedUsers().slice(start, start + size);
  });

  // Forms
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
    this.currentPage.set(1); // Reset to first page on search
  }

  changePage(delta: number): void {
    this.currentPage.update((p) => p + delta);
  }

  toggleSort(column: SortColumn): void {
    if (this.sortColumn() === column) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('asc');
    }
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
        this.showPasswordForm.set(false);
      },
      error: () => {
        this.changingPassword.set(false);
      },
    });
  }

  toggleRegisterUserForm(): void {
    this.showRegisterForm.update((current) => !current);
    if (this.showRegisterForm()) {
      this.showPasswordForm.set(false);
    }
  }
  
  togglePasswordForm(): void {
    this.showPasswordForm.update((current) => !current);
    if (this.showPasswordForm()) {
      this.showRegisterForm.set(false);
    }
  }

  submitRegisterUser(): void {
    if (this.registerForm.invalid) {
      this.feedback.warning('REGISTER', 'Please fill in all fields correctly.');
      return;
    }

    this.registeringUser.set(true);
    const payload = this.registerForm.getRawValue();
    this.authApi.register(payload).subscribe({
      next: () => {
        this.feedback.success('REGISTER', `User ${payload.username} created with role ${payload.role}.`);
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
