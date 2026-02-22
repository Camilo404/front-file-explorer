import { ChangeDetectionStrategy, Component, computed, DestroyRef, ElementRef, inject, input, output, viewChild } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { debounceTime, distinctUntilChanged } from 'rxjs';

export interface SearchFilters {
  q: string;
  type?: 'file' | 'dir';
  ext?: string;
}

@Component({
  selector: 'app-explorer-toolbar',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(window:keydown)': 'handleKeyboardEvent($event)',
  },
  template: `
    <div class="flex flex-col gap-4 w-full">
      <div class="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 w-full">
        <!-- Search Bar (Left/Center) -->
        <div class="flex-1 w-full lg:max-w-2xl">
          <form class="relative flex items-center w-full group" [formGroup]="searchForm" (ngSubmit)="onSearch()">
            <div class="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
              <i class="fa-solid fa-magnifying-glass text-zinc-400 group-focus-within:text-violet-400 transition-colors"></i>
            </div>
            <input
              #searchInput
              type="text"
              formControlName="q"
              placeholder="Search files... (Press '/')"
              class="w-full rounded-2xl border border-white/10 bg-zinc-900/50 py-2.5 pl-11 pr-12 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-violet-500/50 focus:bg-zinc-900 focus:outline-none focus:ring-4 focus:ring-violet-500/10 shadow-sm"
            />
            <div class="absolute inset-y-0 right-0 flex items-center pr-2">
              @if (searchForm.value.q) {
                <button type="button" class="p-1.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors" (click)="clearSearch()">
                  <i class="fa-solid fa-xmark"></i>
                </button>
              } @else {
                <div class="hidden md:flex items-center justify-center px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] font-mono text-zinc-500">
                  /
                </div>
              }
            </div>
          </form>
        </div>

        <!-- Actions (Right) -->
        <div class="flex items-center gap-2 shrink-0 w-full lg:w-auto justify-between lg:justify-end overflow-x-auto pb-1 lg:pb-0 scrollbar-hide">
           <!-- View Mode Toggle -->
           <div class="flex items-center rounded-xl bg-zinc-800/50 p-1 border border-white/5 shrink-0">
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg transition-all"
                [class.bg-white/10]="viewMode() === 'list'"
                [class.text-white]="viewMode() === 'list'"
                [class.text-zinc-500]="viewMode() !== 'list'"
                [class.hover:text-zinc-300]="viewMode() !== 'list'"
                (click)="viewModeChange.emit('list')"
                aria-label="List view"
                title="List view"
              >
                <i class="fa-solid fa-list text-xs"></i>
              </button>
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-lg transition-all"
                [class.bg-white/10]="viewMode() === 'grid'"
                [class.text-white]="viewMode() === 'grid'"
                [class.text-zinc-500]="viewMode() !== 'grid'"
                [class.hover:text-zinc-300]="viewMode() !== 'grid'"
                (click)="viewModeChange.emit('grid')"
                aria-label="Grid view"
                title="Grid view"
              >
                <i class="fa-solid fa-border-all text-xs"></i>
              </button>
            </div>

            <div class="h-6 w-px bg-white/10 mx-1 shrink-0"></div>

          <button
            type="button"
            class="group relative flex items-center justify-center size-10 rounded-xl bg-zinc-800/50 text-zinc-400 transition-all hover:bg-zinc-700 hover:text-white border border-white/5 shrink-0"
            title="Refresh"
            aria-label="Refresh"
            (click)="refreshClick.emit()"
          >
            <i class="fa-solid fa-rotate-right group-hover:rotate-180 transition-transform duration-500"></i>
          </button>

          <button
            type="button"
            class="group relative flex items-center gap-2 rounded-xl bg-zinc-800/50 px-4 py-2.5 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white border border-white/5 shrink-0"
            (click)="newDirectoryClick.emit()"
          >
            <i class="fa-solid fa-folder-plus text-violet-400 group-hover:scale-110 transition-transform"></i>
            <span class="hidden sm:inline">New Folder</span>
          </button>

          <label
            class="group relative flex cursor-pointer items-center gap-2 rounded-xl bg-violet-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 border border-violet-500/50 shrink-0"
          >
            <i class="fa-solid fa-cloud-arrow-up group-hover:-translate-y-0.5 transition-transform"></i>
            <span class="hidden sm:inline">Upload</span>
            <input type="file" class="hidden" multiple (change)="onUpload($event)" />
          </label>
        </div>
      </div>

      <!-- Breadcrumbs -->
      <div class="flex items-center gap-1 text-sm overflow-x-auto pb-1 scrollbar-hide w-full">
         <button 
            type="button" 
            class="flex items-center gap-1.5 px-2 py-1 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-zinc-200 transition-colors shrink-0"
            (click)="breadcrumbClick.emit('/')"
         >
            <i class="fa-solid fa-hard-drive text-xs"></i>
            <span class="font-medium">Root</span>
         </button>
         
         @for (crumb of breadcrumbs(); track crumb.path) {
            <span class="text-zinc-600 text-xs shrink-0"><i class="fa-solid fa-chevron-right"></i></span>
            <button 
                type="button"
                class="px-2 py-1 rounded-lg transition-colors font-medium truncate max-w-[150px] shrink-0"
                [class.text-zinc-100]="crumb.isLast"
                [class.bg-white/5]="crumb.isLast"
                [class.text-zinc-400]="!crumb.isLast"
                [class.hover:bg-white/5]="!crumb.isLast"
                [class.hover:text-zinc-200]="!crumb.isLast"
                (click)="!crumb.isLast && breadcrumbClick.emit(crumb.path)"
            >
                {{ crumb.name }}
            </button>
         }
      </div>
    </div>
  `,
})
export class ExplorerToolbarComponent {
  readonly viewMode = input<'list' | 'grid'>('list');
  readonly currentPath = input<string>('/');
  readonly searchDisabled = input<boolean>(false);
  
  readonly refreshClick = output<void>();
  readonly newDirectoryClick = output<void>();
  readonly uploadFiles = output<FileList>();
  readonly search = output<SearchFilters>();
  readonly clearSearchEvent = output<void>();
  readonly viewModeChange = output<'list' | 'grid'>();
  readonly breadcrumbClick = output<string>();

  readonly searchInput = viewChild<ElementRef<HTMLInputElement>>('searchInput');

  readonly breadcrumbs = computed(() => {
    const path = this.currentPath();
    if (path === '/' || !path) return [];
    
    const segments = path.split('/').filter(Boolean);
    let accumulated = '';
    
    return segments.map((segment, index) => {
      accumulated += '/' + segment;
      return {
        name: segment,
        path: accumulated,
        isLast: index === segments.length - 1
      };
    });
  });

  private readonly fb = new FormBuilder();
  private readonly destroyRef = inject(DestroyRef);

  readonly searchForm = this.fb.nonNullable.group({
    q: '',
  });

  constructor() {
    this.searchForm.controls.q.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => {
        this.onSearch();
      });
  }

  handleKeyboardEvent(event: KeyboardEvent) {
    if (event.key === '/' && !['INPUT', 'TEXTAREA'].includes((event.target as HTMLElement).tagName)) {
      event.preventDefault();
      this.searchInput()?.nativeElement.focus();
    }
  }

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(input.files);
    }
  }

  onSearch(): void {
    if (this.searchDisabled()) return;
    const q = this.searchForm.getRawValue().q.trim();
    if (q) {
      this.search.emit({ q });
    } else {
      this.clearSearch();
    }
  }

  clearSearch(): void {
    this.searchForm.reset({ q: '' });
    this.clearSearchEvent.emit();
  }
}
