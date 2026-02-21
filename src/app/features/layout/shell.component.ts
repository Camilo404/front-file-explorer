import { ChangeDetectionStrategy, Component, computed, effect, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { AuthApiService } from '../../core/api/auth-api.service';
import { SystemApiService } from '../../core/api/system-api.service';
import { AuthStoreService } from '../../core/auth/auth-store.service';
import { ErrorStoreService } from '../../core/errors/error-store.service';
import { UploadProgressPanelComponent } from '../../shared/components/upload-progress-panel.component';

@Component({
  selector: 'app-shell',
  imports: [RouterLink, RouterLinkActive, RouterOutlet, ReactiveFormsModule, UploadProgressPanelComponent],
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
    .nav-item-6 { animation: navItemIn 0.3s 0.30s ease both; }
    .nav-item-7 { animation: navItemIn 0.3s 0.35s ease both; }
    .nav-item-8 { animation: navItemIn 0.3s 0.40s ease both; }

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

    .custom-scrollbar::-webkit-scrollbar {
      width: 6px;
      height: 6px;
    }
    .custom-scrollbar::-webkit-scrollbar-track {
      background: transparent;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.1);
      border-radius: 10px;
    }
    .custom-scrollbar::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.2);
    }
  `,
  template: `
    <div class="flex h-screen bg-zinc-950 text-zinc-200 font-sans selection:bg-violet-500/30 overflow-hidden">

      <!-- ═══════════════════════════════ DESKTOP SIDEBAR ═══════════════════════════════ -->
      <aside class="hidden md:flex flex-col border-r border-white/5 bg-zinc-950/50 backdrop-blur-xl transition-all duration-300 relative z-40"
             [class.w-64]="!sidebarCollapsed()" [class.w-20]="sidebarCollapsed()">
        
        <!-- Logo -->
        <div class="flex h-16 items-center px-4 shrink-0 border-b border-white/5" [class.justify-center]="sidebarCollapsed()">
          <div class="flex items-center gap-3">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/20">
              <i class="fa-solid fa-folder-open text-sm"></i>
            </div>
            @if (!sidebarCollapsed()) {
              <span class="text-lg font-semibold tracking-tight text-white truncate">FileExplorer</span>
            }
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1.5 custom-scrollbar">
          <a routerLink="/explorer" routerLinkActive #explorerActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-violet-600]="explorerActive.isActive" [class.text-white]="explorerActive.isActive" [class.shadow-md]="explorerActive.isActive" [class.shadow-violet-500/20]="explorerActive.isActive" [class.text-zinc-400]="!explorerActive.isActive" [class.hover:bg-white/5]="!explorerActive.isActive" [class.hover:text-white]="!explorerActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Explorer">
            <i class="fa-solid fa-folder-open text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="explorerActive.isActive"></i>
            @if (!sidebarCollapsed()) {
              <span class="text-sm font-medium truncate">Explorer</span>
            }
          </a>
          
          @if (canManageFiles()) {
            <div class="my-2 border-t border-white/5"></div>
            <a routerLink="/jobs" routerLinkActive #jobsActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-violet-600]="jobsActive.isActive" [class.text-white]="jobsActive.isActive" [class.shadow-md]="jobsActive.isActive" [class.shadow-violet-500/20]="jobsActive.isActive" [class.text-zinc-400]="!jobsActive.isActive" [class.hover:bg-white/5]="!jobsActive.isActive" [class.hover:text-white]="!jobsActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Jobs">
              <i class="fa-solid fa-list-check text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="jobsActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Jobs</span>
              }
            </a>
            <a routerLink="/trash" routerLinkActive #trashActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-rose-600]="trashActive.isActive" [class.text-white]="trashActive.isActive" [class.shadow-md]="trashActive.isActive" [class.shadow-rose-500/20]="trashActive.isActive" [class.text-zinc-400]="!trashActive.isActive" [class.hover:bg-white/5]="!trashActive.isActive" [class.hover:text-white]="!trashActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Trash">
              <i class="fa-solid fa-trash text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="trashActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Trash</span>
              }
            </a>
            <a routerLink="/shares" routerLinkActive #sharesActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-violet-600]="sharesActive.isActive" [class.text-white]="sharesActive.isActive" [class.shadow-md]="sharesActive.isActive" [class.shadow-violet-500/20]="sharesActive.isActive" [class.text-zinc-400]="!sharesActive.isActive" [class.hover:bg-white/5]="!sharesActive.isActive" [class.hover:text-white]="!sharesActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Shares">
              <i class="fa-solid fa-share-nodes text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="sharesActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Shares</span>
              }
            </a>
          }

          @if (isAdmin()) {
            <div class="my-2 border-t border-white/5"></div>
            <a routerLink="/audit" routerLinkActive #auditActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-amber-600]="auditActive.isActive" [class.text-white]="auditActive.isActive" [class.shadow-md]="auditActive.isActive" [class.shadow-amber-500/20]="auditActive.isActive" [class.text-zinc-400]="!auditActive.isActive" [class.hover:bg-white/5]="!auditActive.isActive" [class.hover:text-white]="!auditActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Audit">
              <i class="fa-solid fa-clipboard-list text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="auditActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Audit</span>
              }
            </a>
            <a routerLink="/users" routerLinkActive #usersActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-violet-600]="usersActive.isActive" [class.text-white]="usersActive.isActive" [class.shadow-md]="usersActive.isActive" [class.shadow-violet-500/20]="usersActive.isActive" [class.text-zinc-400]="!usersActive.isActive" [class.hover:bg-white/5]="!usersActive.isActive" [class.hover:text-white]="!usersActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Users">
              <i class="fa-solid fa-users text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="usersActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Users</span>
              }
            </a>
            <a routerLink="/storage" routerLinkActive #storageActive="routerLinkActive" class="flex items-center gap-3 rounded-lg px-3 py-2.5 transition-all group" [class.bg-violet-600]="storageActive.isActive" [class.text-white]="storageActive.isActive" [class.shadow-md]="storageActive.isActive" [class.shadow-violet-500/20]="storageActive.isActive" [class.text-zinc-400]="!storageActive.isActive" [class.hover:bg-white/5]="!storageActive.isActive" [class.hover:text-white]="!storageActive.isActive" [class.justify-center]="sidebarCollapsed()" title="Storage">
              <i class="fa-solid fa-hard-drive text-sm shrink-0 group-hover:scale-110 transition-transform" [class.text-white]="storageActive.isActive"></i>
              @if (!sidebarCollapsed()) {
                <span class="text-sm font-medium truncate">Storage</span>
              }
            </a>
          }
        </nav>

        <!-- Bottom Section -->
        <div class="p-3 border-t border-white/5 flex flex-col gap-3 shrink-0 bg-zinc-950/50">
          <!-- Health -->
          <div class="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/5" [class.justify-center]="sidebarCollapsed()" [title]="healthStatus()">
            <div class="h-2 w-2 shrink-0 rounded-full shadow-sm" [class.bg-emerald-400]="healthStatus() === 'API: ok'" [class.shadow-emerald-500/50]="healthStatus() === 'API: ok'" [class.bg-rose-500]="healthStatus() !== 'API: ok'" [class.shadow-rose-500/50]="healthStatus() !== 'API: ok'"></div>
            @if (!sidebarCollapsed()) {
              <span class="text-xs font-medium text-zinc-400 truncate">{{ healthStatus() }}</span>
            }
          </div>

          <!-- User Profile & Logout -->
          <div class="flex items-center gap-3 px-2 py-1" [class.justify-center]="sidebarCollapsed()" [class.flex-col]="sidebarCollapsed()">
            <div class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-600 text-white font-bold text-xs shadow-md uppercase" [title]="username() + ' (' + role() + ')'">
              {{ username().charAt(0) }}
            </div>
            @if (!sidebarCollapsed()) {
              <div class="flex-1 min-w-0 flex flex-col">
                <span class="text-sm font-medium text-white truncate leading-tight">{{ username() }}</span>
                <span class="text-xs text-zinc-500 capitalize truncate">{{ role() }}</span>
              </div>
            }
            <button type="button" class="shrink-0 rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors" title="Logout" (click)="onLogout()">
              <i class="fa-solid fa-right-from-bracket text-sm"></i>
            </button>
          </div>

          <!-- Collapse Toggle -->
          <button type="button" class="hidden md:flex items-center justify-center w-full rounded-lg p-1.5 text-zinc-500 hover:bg-white/5 hover:text-zinc-300 transition-colors" (click)="toggleSidebar()" [title]="sidebarCollapsed() ? 'Expand sidebar' : 'Collapse sidebar'">
            <i class="fa-solid text-xs transition-transform duration-300" [class.fa-chevron-left]="!sidebarCollapsed()" [class.fa-chevron-right]="sidebarCollapsed()"></i>
          </button>
        </div>
      </aside>

      <!-- ═══════════════════════════════ MAIN CONTENT AREA ═══════════════════════════════ -->
      <div class="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        
        <!-- Mobile Header -->
        <header class="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md shrink-0 z-30">
          <div class="flex items-center gap-2.5">
            <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/30">
              <i class="fa-solid fa-folder-open text-sm"></i>
            </div>
            <span class="text-lg font-semibold tracking-tight text-white">FileExplorer</span>
          </div>
          
          <button
            type="button"
            class="flex flex-col items-center justify-center gap-1.25 w-10 h-10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
            aria-label="Toggle menu"
            [attr.aria-expanded]="mobileMenuOpen()"
            (click)="toggleMobileMenu()"
          >
            <span class="bar" [class.bar-top-open]="mobileMenuOpen()"></span>
            <span class="bar" [class.bar-mid-open]="mobileMenuOpen()"></span>
            <span class="bar" [class.bar-bot-open]="mobileMenuOpen()"></span>
          </button>
        </header>

        <!-- Mobile Bottom Sheet -->
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
            class="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-zinc-950/95 backdrop-blur-2xl border-t border-white/10 shadow-2xl shadow-black/70 sheet-enter pb-safe max-h-[85vh] flex flex-col"
          >
            <!-- Handle bar -->
            <div class="flex justify-center pt-3 pb-1 shrink-0">
              <div class="w-10 h-1 rounded-full bg-white/20"></div>
            </div>

            <!-- Profile card -->
            <div class="mx-4 mt-3 mb-4 flex items-center gap-3 rounded-2xl bg-white/5 border border-white/10 px-4 py-3 shrink-0">
              <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-linear-to-br from-violet-500 to-violet-600 text-white font-bold text-sm shadow-lg shadow-violet-500/30 uppercase">
                {{ username().charAt(0) }}
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-semibold text-white truncate">{{ username() }}</p>
                <p class="text-xs text-zinc-400 capitalize">{{ role() }}</p>
              </div>
              <!-- Health pill -->
              <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-full border"
                [class.border-emerald-500/30]="healthStatus() === 'API: ok'"
                [class.bg-emerald-500/10]="healthStatus() === 'API: ok'"
                [class.border-rose-500/30]="healthStatus() !== 'API: ok'"
                [class.bg-rose-500/10]="healthStatus() !== 'API: ok'"
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
            <nav class="px-4 flex-1 overflow-y-auto custom-scrollbar grid gap-2 pb-4" aria-label="Main navigation">
              <a
                routerLink="/explorer"
                routerLinkActive #explorerActiveMob="routerLinkActive"
                class="nav-item-1 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                [class.bg-violet-600]="explorerActiveMob.isActive"
                [class.shadow-lg]="explorerActiveMob.isActive"
                [class.shadow-violet-500/30]="explorerActiveMob.isActive"
                [class.text-white]="explorerActiveMob.isActive"
                [class.bg-white/5]="!explorerActiveMob.isActive"
                [class.text-zinc-300]="!explorerActiveMob.isActive"
                [class.hover:bg-white/10]="!explorerActiveMob.isActive"
                (click)="closeMobileMenu()"
              >
                <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                  [class.bg-white]="explorerActiveMob.isActive"
                  [class.bg-white/10]="!explorerActiveMob.isActive">
                  <i class="fa-solid fa-folder-open text-base" [class.text-violet-600]="explorerActiveMob.isActive"></i>
                </span>
                <div class="flex-1">
                  <p class="text-sm font-semibold">Explorer</p>
                  <p class="text-xs opacity-60">Browse your files</p>
                </div>
                @if (explorerActiveMob.isActive) {
                  <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                }
              </a>

              @if (canManageFiles()) {
                <a
                  routerLink="/jobs"
                  routerLinkActive #jobsActiveMob="routerLinkActive"
                  class="nav-item-2 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-violet-600]="jobsActiveMob.isActive"
                  [class.shadow-lg]="jobsActiveMob.isActive"
                  [class.shadow-violet-500/30]="jobsActiveMob.isActive"
                  [class.text-white]="jobsActiveMob.isActive"
                  [class.bg-white/5]="!jobsActiveMob.isActive"
                  [class.text-zinc-300]="!jobsActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="jobsActiveMob.isActive"
                    [class.bg-white/10]="!jobsActiveMob.isActive">
                    <i class="fa-solid fa-list-check text-base" [class.text-violet-600]="jobsActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Jobs</p>
                    <p class="text-xs opacity-60">Async operations</p>
                  </div>
                  @if (jobsActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>

                <a
                  routerLink="/trash"
                  routerLinkActive #trashActiveMob="routerLinkActive"
                  class="nav-item-3 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-rose-600]="trashActiveMob.isActive"
                  [class.shadow-lg]="trashActiveMob.isActive"
                  [class.shadow-rose-500/30]="trashActiveMob.isActive"
                  [class.text-white]="trashActiveMob.isActive"
                  [class.bg-white/5]="!trashActiveMob.isActive"
                  [class.text-zinc-300]="!trashActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="trashActiveMob.isActive"
                    [class.bg-white/10]="!trashActiveMob.isActive">
                    <i class="fa-solid fa-trash text-base" [class.text-rose-600]="trashActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Trash</p>
                    <p class="text-xs opacity-60">Deleted files</p>
                  </div>
                  @if (trashActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>

                <a
                  routerLink="/shares"
                  routerLinkActive #sharesActiveMob="routerLinkActive"
                  class="nav-item-4 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-violet-600]="sharesActiveMob.isActive"
                  [class.shadow-lg]="sharesActiveMob.isActive"
                  [class.shadow-violet-500/30]="sharesActiveMob.isActive"
                  [class.text-white]="sharesActiveMob.isActive"
                  [class.bg-white/5]="!sharesActiveMob.isActive"
                  [class.text-zinc-300]="!sharesActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="sharesActiveMob.isActive"
                    [class.bg-white/10]="!sharesActiveMob.isActive">
                    <i class="fa-solid fa-share-nodes text-base" [class.text-violet-600]="sharesActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Shares</p>
                    <p class="text-xs opacity-60">Public file links</p>
                  </div>
                  @if (sharesActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>
              }

              @if (isAdmin()) {
                <a
                  routerLink="/audit"
                  routerLinkActive #auditActiveMob="routerLinkActive"
                  class="nav-item-5 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-amber-600]="auditActiveMob.isActive"
                  [class.shadow-lg]="auditActiveMob.isActive"
                  [class.shadow-amber-500/30]="auditActiveMob.isActive"
                  [class.text-white]="auditActiveMob.isActive"
                  [class.bg-white/5]="!auditActiveMob.isActive"
                  [class.text-zinc-300]="!auditActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="auditActiveMob.isActive"
                    [class.bg-white/10]="!auditActiveMob.isActive">
                    <i class="fa-solid fa-clipboard-list text-base" [class.text-amber-600]="auditActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Audit</p>
                    <p class="text-xs opacity-60">Activity logs</p>
                  </div>
                  @if (auditActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>

                <a
                  routerLink="/users"
                  routerLinkActive #usersActiveMob="routerLinkActive"
                  class="nav-item-6 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-violet-600]="usersActiveMob.isActive"
                  [class.shadow-lg]="usersActiveMob.isActive"
                  [class.shadow-violet-500/30]="usersActiveMob.isActive"
                  [class.text-white]="usersActiveMob.isActive"
                  [class.bg-white/5]="!usersActiveMob.isActive"
                  [class.text-zinc-300]="!usersActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="usersActiveMob.isActive"
                    [class.bg-white/10]="!usersActiveMob.isActive">
                    <i class="fa-solid fa-users text-base" [class.text-violet-600]="usersActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Users</p>
                    <p class="text-xs opacity-60">Manage accounts</p>
                  </div>
                  @if (usersActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>

                <a
                  routerLink="/storage"
                  routerLinkActive #storageActiveMob="routerLinkActive"
                  class="nav-item-7 flex items-center gap-3 rounded-2xl px-4 py-3.5 transition-all duration-150 active:scale-95"
                  [class.bg-violet-600]="storageActiveMob.isActive"
                  [class.shadow-lg]="storageActiveMob.isActive"
                  [class.shadow-violet-500/30]="storageActiveMob.isActive"
                  [class.text-white]="storageActiveMob.isActive"
                  [class.bg-white/5]="!storageActiveMob.isActive"
                  [class.text-zinc-300]="!storageActiveMob.isActive"
                  (click)="closeMobileMenu()"
                >
                  <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                    [class.bg-white]="storageActiveMob.isActive"
                    [class.bg-white/10]="!storageActiveMob.isActive">
                    <i class="fa-solid fa-hard-drive text-base" [class.text-violet-600]="storageActiveMob.isActive"></i>
                  </span>
                  <div class="flex-1">
                    <p class="text-sm font-semibold">Storage</p>
                    <p class="text-xs opacity-60">Disk statistics</p>
                  </div>
                  @if (storageActiveMob.isActive) {
                    <i class="fa-solid fa-chevron-right text-xs opacity-70 shrink-0"></i>
                  }
                </a>
              }

              <!-- Bottom row: Logout -->
              <div class="mt-2 grid gap-2 nav-item-8">
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-2xl bg-white/5 px-4 py-3.5 text-zinc-300 hover:bg-rose-900/40 hover:text-rose-300 transition-all active:scale-95"
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
            </nav>
          </div>
        }

        <!-- Main Scrollable Area -->
        <main class="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          <div class="mx-auto max-w-400">
            <router-outlet />
          </div>
        </main>
      </div>

      <app-upload-progress-panel />
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
  readonly mobileMenuOpen = signal(false);
  readonly sidebarCollapsed = signal(false);

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

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}
