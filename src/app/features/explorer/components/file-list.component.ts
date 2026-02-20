import { ChangeDetectionStrategy, Component, computed, input, output, signal } from '@angular/core';

import { FileItem } from '../../../core/models/api.models';
import { SearchFilters, SearchPanelComponent } from './search-panel.component';

@Component({
  selector: 'app-file-list',
  imports: [SearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown)': 'onDocumentKeyDown($event)',
  },
  template: `
    <section
      class="relative flex h-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5"
      (dragenter)="onExternalDragEnter($event)"
      (dragover)="onExternalDragOver($event)"
      (dragleave)="onExternalDragLeave($event)"
      (drop)="onExternalDrop($event)"
    >
      <header class="flex shrink-0 flex-col gap-4 border-b border-white/5 bg-white/5 p-4 sm:gap-5 sm:p-5">
        <app-search-panel (search)="search.emit($event)" (clearFilters)="clearSearch.emit()" />

        <!-- External file drop overlay -->
        @if (isExternalDragOver()) {
          <div
            class="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-4 rounded-2xl border-2 border-dashed border-violet-500/50 bg-zinc-950/80 backdrop-blur-md"
            aria-hidden="true"
          >
            <i class="fa-solid fa-cloud-arrow-up text-4xl text-violet-400"></i>
            <p class="text-xl font-bold text-violet-300">Suelta para subir archivos</p>
            <p class="mt-1 text-sm font-medium text-zinc-400">Se subirán a la carpeta actual</p>
          </div>
        }

        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex flex-wrap items-center gap-3">
            <i class="fa-solid fa-table-list text-violet-400"></i>
            <h2 class="text-sm font-bold tracking-wide text-zinc-100">
              {{ isSearchMode() ? 'Resultados de búsqueda' : 'Contenido' }}
            </h2>
            <span class="rounded-lg bg-white/5 px-2.5 py-1 text-xs font-semibold text-zinc-300 ring-1 ring-white/10">
              {{ totalItems() }} items
            </span>
            @if (selectedPaths().length > 1) {
              <span class="rounded-lg bg-violet-500/15 px-2.5 py-1 text-xs font-semibold text-violet-300 ring-1 ring-violet-500/30">
                {{ selectedPaths().length }} sel.
              </span>
            }
            @if (isDragging()) {
              <span class="hidden rounded-lg bg-amber-500/15 px-2.5 py-1 text-xs font-semibold text-amber-300 ring-1 ring-amber-500/30 sm:inline-flex sm:items-center">
                <i class="fa-solid fa-hand-pointer mr-1"></i>
                Arrastrando {{ dragCount() }} {{ dragCount() === 1 ? 'elemento' : 'elementos' }}
              </span>
            }
          </div>

          <div class="flex items-center gap-3">
            <!-- View Toggle -->
            <div class="flex items-center rounded-lg bg-zinc-900/50 p-1 ring-1 ring-white/10">
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded transition-all"
                [class.bg-white/10]="viewMode() === 'list'"
                [class.text-white]="viewMode() === 'list'"
                [class.text-zinc-500]="viewMode() !== 'list'"
                [class.hover:text-zinc-300]="viewMode() !== 'list'"
                (click)="viewMode.set('list')"
                aria-label="Vista de lista"
                title="Vista de lista"
              >
                <i class="fa-solid fa-list text-xs"></i>
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded transition-all"
                [class.bg-white/10]="viewMode() === 'grid'"
                [class.text-white]="viewMode() === 'grid'"
                [class.text-zinc-500]="viewMode() !== 'grid'"
                [class.hover:text-zinc-300]="viewMode() !== 'grid'"
                (click)="viewMode.set('grid')"
                aria-label="Vista de cuadrícula"
                title="Vista de cuadrícula"
              >
                <i class="fa-solid fa-border-all text-xs"></i>
              </button>
            </div>

            <span class="hidden text-xs font-medium text-zinc-400 sm:inline">
              Página {{ page() }} de {{ totalPages() }}
            </span>
            <div class="flex gap-1.5">
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 transition-all hover:bg-white/10 hover:text-white hover:shadow-md disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-zinc-300 disabled:hover:shadow-none"
                [disabled]="page() <= 1"
                (click)="changePage.emit(-1)"
                aria-label="Página anterior"
              >
                <i class="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button
                type="button"
                class="flex size-8 items-center justify-center rounded-xl bg-white/5 text-zinc-300 transition-all hover:bg-white/10 hover:text-white hover:shadow-md disabled:opacity-40 disabled:hover:bg-white/5 disabled:hover:text-zinc-300 disabled:hover:shadow-none"
                [disabled]="page() >= totalPages()"
                (click)="changePage.emit(1)"
                aria-label="Página siguiente"
              >
                <i class="fa-solid fa-chevron-right text-xs"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div
        class="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
        role="presentation"
        tabindex="-1"
        (click)="onContainerClick($event)"
      >
        @if (viewMode() === 'list') {
          <table class="w-full table-fixed text-left text-sm">
            <colgroup>
              <col class="w-10" />
              <col class="w-1/2 sm:w-88" />
              <col class="hidden w-24 sm:table-column" />
              <col class="hidden w-36 md:table-column" />
              <col class="hidden w-36 lg:table-column" />
              <col class="w-20" />
            </colgroup>
            <thead class="sticky top-0 z-10 bg-zinc-900/95 backdrop-blur-md">
              <tr class="border-b border-white/5 text-xs font-medium text-zinc-400">
                <th class="px-2 py-3 sm:px-4" aria-label="Selección"></th>
                <th class="px-2 py-3 sm:px-4">Nombre</th>
                <th class="hidden px-4 py-3 sm:table-cell">Tamaño</th>
                <th class="hidden px-4 py-3 md:table-cell">Modificado</th>
                <th class="hidden px-4 py-3 lg:table-cell">Creado</th>
                <th class="px-2 py-3 text-center sm:px-4 pr-6 sm:pr-8">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">

              <!-- Parent (..) row always first, only outside search mode -->
              @if (showParentRow()) {
                <tr
                  class="group cursor-pointer select-none transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-violet-500"
                  [class.ring-2]="dragOverParent()"
                  [class.ring-inset]="dragOverParent()"
                  [class.ring-violet-400]="dragOverParent()"
                  [class.bg-violet-500/10]="dragOverParent()"
                  tabindex="0"
                  aria-label="Carpeta superior"
                  (dblclick)="navigateToParent.emit()"
                  (keydown.enter)="navigateToParent.emit()"
                  (dragover)="onDragOverParent($event)"
                  (dragleave)="onDragLeaveParent()"
                  (drop)="onDropOnParent($event)"
                >
                  <td class="px-2 py-3 sm:px-4"></td>
                  <td class="px-2 py-3 sm:px-4">
                    <div class="flex items-center gap-3">
                      <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                        <i class="fa-solid fa-folder-open text-zinc-400"></i>
                      </div>
                      <span class="font-medium text-zinc-400 transition-colors group-hover:text-zinc-200">..</span>
                    </div>
                  </td>
                  <td class="hidden px-4 py-3 text-zinc-500 sm:table-cell">-</td>
                  <td class="hidden px-4 py-3 text-zinc-500 md:table-cell">-</td>
                  <td class="hidden px-4 py-3 text-zinc-500 lg:table-cell">-</td>
                  <td class="px-2 py-3 sm:px-4"></td>
                </tr>
              }

              @if (items().length === 0 && !showParentRow()) {
                <tr>
                  <td colspan="6">
                    <div class="flex flex-col items-center justify-center p-8 text-center opacity-50">
                      <i class="fa-solid fa-folder-open mb-3 text-5xl text-zinc-400"></i>
                      <p class="mt-1 text-sm font-medium text-zinc-400">No hay elementos para mostrar en esta carpeta.</p>
                    </div>
                  </td>
                </tr>
              }

              @if (items().length === 0 && showParentRow()) {
                <tr>
                  <td colspan="6">
                    <div class="flex flex-col items-center justify-center p-6 text-center opacity-50">
                      <p class="mt-1 text-sm font-medium text-zinc-400">La carpeta está vacía.</p>
                    </div>
                  </td>
                </tr>
              }

              @for (item of items(); track item.path; let idx = $index) {
                <tr
                  class="group cursor-pointer select-none transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-violet-500"
                  [class.bg-violet-500/10]="isSelected(item.path)"
                  [class.opacity-40]="isDragging() && isInDrag(item.path)"
                  [class.ring-2]="isDirectory(item) && dragOverPath() === item.path"
                  [class.ring-inset]="isDirectory(item) && dragOverPath() === item.path"
                  [class.ring-violet-400]="isDirectory(item) && dragOverPath() === item.path"
                  [class.bg-violet-500/15]="isDirectory(item) && dragOverPath() === item.path"
                  tabindex="0"
                  draggable="true"
                  data-file-item="true"
                  [attr.aria-selected]="isSelected(item.path)"
                  [attr.aria-label]="item.name"
                  (click)="onRowClick($event, item, idx)"
                  (dblclick)="onRowDblClick(item)"
                  (keydown.enter)="onRowDblClick(item)"
                  (keydown.space)="onRowKeySpace($event, item, idx)"
                  (contextmenu)="onContextMenu($event, item)"
                  (dragstart)="onDragStart($event, item)"
                  (dragend)="onDragEnd()"
                  (dragover)="onDragOver($event, item)"
                  (dragleave)="onDragLeave($event, item)"
                  (drop)="onDrop($event, item)"
                >
                  <!-- Checkbox -->
                  <td class="px-2 py-3 sm:px-4">
                    <div class="flex items-center justify-center">
                      <input
                        type="checkbox"
                        class="size-4 cursor-pointer rounded border-white/20 bg-white/5 text-violet-500 transition-all focus:ring-violet-500/50 focus:ring-offset-0"
                        [class.opacity-0]="!isSelected(item.path)"
                        [class.group-hover:opacity-100]="!isSelected(item.path)"
                        [checked]="isSelected(item.path)"
                        (click)="$event.stopPropagation()"
                        (change)="onCheckboxChange(item)"
                        [attr.aria-label]="'Seleccionar ' + item.name"
                      />
                    </div>
                  </td>

                  <!-- Name -->
                  <td class="overflow-hidden px-2 py-3 sm:px-4">
                    <div class="flex min-w-0 items-center gap-3">
                      <div class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5 shadow-inner">
                        @if (isMedia(item) && thumbnailUrl(item.path)) {
                          <img
                            [src]="thumbnailUrl(item.path)"
                            [alt]="item.name"
                            class="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                            loading="lazy"
                          />
                        } @else {
                          @if (isDirectory(item)) {
                            <i class="fa-solid fa-folder text-violet-400"></i>
                          } @else if (isVideo(item)) {
                            <i class="fa-solid fa-file-video text-violet-300"></i>
                          } @else {
                            <i class="fa-solid fa-file text-zinc-400"></i>
                          }
                        }
                      </div>
                      <span
                        class="min-w-0 truncate font-medium transition-colors"
                        [class.text-violet-400]="isSelected(item.path)"
                        [class.text-zinc-200]="!isSelected(item.path)"
                      >
                        {{ item.name }}
                      </span>
                    </div>
                  </td>

                  <td class="hidden px-4 py-3 text-zinc-400 sm:table-cell">{{ itemMeta(item) }}</td>
                  <td class="hidden px-4 py-3 text-zinc-400 md:table-cell">{{ formatDate(item.modified_at) }}</td>
                  <td class="hidden px-4 py-3 text-zinc-400 lg:table-cell">{{ formatDate(item.created_at) }}</td>

                  <td class="px-2 py-3 sm:px-3 pr-6 sm:pr-8">
                    <div class="flex items-center justify-end gap-1.5">
                      <button
                        type="button"
                        class="inline-flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
                        (click)="$event.stopPropagation(); onContextMenuButton($event, item)"
                        aria-label="Más opciones"
                        title="Más opciones"
                      >
                        <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                      </button>
                      <button
                        type="button"
                        class="hidden size-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/10 hover:text-white sm:inline-flex"
                        (click)="$event.stopPropagation(); info.emit(item.path)"
                        aria-label="Información"
                        title="Información"
                      >
                        <i class="fa-solid fa-circle-info text-xs"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        } @else {
          <!-- Grid View -->
          <div class="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] gap-4 p-4">
            <!-- Parent (..) card always first, only outside search mode -->
            @if (showParentRow()) {
              <div
                class="group flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-white/5 bg-white/5 p-4 transition-all hover:bg-white/10 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                [class.ring-2]="dragOverParent()"
                [class.ring-inset]="dragOverParent()"
                [class.ring-violet-400]="dragOverParent()"
                [class.bg-violet-500/10]="dragOverParent()"
                tabindex="0"
                aria-label="Carpeta superior"
                (dblclick)="navigateToParent.emit()"
                (keydown.enter)="navigateToParent.emit()"
                (dragover)="onDragOverParent($event)"
                (dragleave)="onDragLeaveParent()"
                (drop)="onDropOnParent($event)"
              >
                <div class="flex size-12 items-center justify-center rounded-2xl bg-white/5 shadow-inner">
                  <i class="fa-solid fa-folder-open text-2xl text-zinc-400"></i>
                </div>
                <span class="text-sm font-medium text-zinc-400 transition-colors group-hover:text-zinc-200">..</span>
              </div>
            }

            @if (items().length === 0 && !showParentRow()) {
              <div class="col-span-full flex flex-col items-center justify-center p-8 text-center opacity-50">
                <i class="fa-solid fa-folder-open mb-3 text-5xl text-zinc-400"></i>
                <p class="mt-1 text-sm font-medium text-zinc-400">No hay elementos para mostrar en esta carpeta.</p>
              </div>
            }

            @if (items().length === 0 && showParentRow()) {
              <div class="col-span-full flex flex-col items-center justify-center p-6 text-center opacity-50">
                <p class="mt-1 text-sm font-medium text-zinc-400">La carpeta está vacía.</p>
              </div>
            }

            @for (item of items(); track item.path; let idx = $index) {
              <div
                class="group relative flex aspect-square cursor-pointer flex-col overflow-hidden rounded-xl border border-white/5 bg-white/5 transition-all hover:bg-white/10 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
                [class.ring-2]="isSelected(item.path)"
                [class.ring-inset]="isSelected(item.path)"
                [class.ring-violet-500]="isSelected(item.path)"
                [class.bg-violet-500/10]="isSelected(item.path)"
                [class.opacity-40]="isDragging() && isInDrag(item.path)"
                [class.ring-2]="isDirectory(item) && dragOverPath() === item.path"
                [class.ring-inset]="isDirectory(item) && dragOverPath() === item.path"
                [class.ring-violet-400]="isDirectory(item) && dragOverPath() === item.path"
                [class.bg-violet-500/15]="isDirectory(item) && dragOverPath() === item.path"
                tabindex="0"
                draggable="true"
                data-file-item="true"
                [attr.aria-selected]="isSelected(item.path)"
                [attr.aria-label]="item.name"
                (click)="onRowClick($event, item, idx)"
                (dblclick)="onRowDblClick(item)"
                (keydown.enter)="onRowDblClick(item)"
                (keydown.space)="onRowKeySpace($event, item, idx)"
                (contextmenu)="onContextMenu($event, item)"
                (dragstart)="onDragStart($event, item)"
                (dragend)="onDragEnd()"
                (dragover)="onDragOver($event, item)"
                (dragleave)="onDragLeave($event, item)"
                (drop)="onDrop($event, item)"
              >
                <!-- Checkbox (Visible on hover or selected) -->
                <div class="absolute left-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100" [class.opacity-100]="isSelected(item.path)">
                  <input
                    type="checkbox"
                    class="size-4 cursor-pointer rounded border-white/20 bg-zinc-900/80 text-violet-500 transition-all focus:ring-violet-500/50 focus:ring-offset-0"
                    [checked]="isSelected(item.path)"
                    (click)="$event.stopPropagation()"
                    (change)="onCheckboxChange(item)"
                    [attr.aria-label]="'Seleccionar ' + item.name"
                  />
                </div>

                <!-- Actions (Visible on hover) -->
                <div class="absolute right-2 top-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    type="button"
                    class="flex size-7 items-center justify-center rounded-lg bg-zinc-900/80 text-zinc-400 transition-all hover:bg-zinc-800 hover:text-white"
                    (click)="$event.stopPropagation(); onContextMenuButton($event, item)"
                    aria-label="Más opciones"
                    title="Más opciones"
                  >
                    <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                  </button>
                </div>

                <!-- Preview Area -->
                <div class="flex flex-1 w-full items-center justify-center overflow-hidden bg-black/20 p-4">
                  @if (isMedia(item) && thumbnailUrl(item.path)) {
                    <img
                      [src]="thumbnailUrl(item.path)"
                      [alt]="item.name"
                      class="size-full object-contain transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />
                  } @else {
                    <div class="flex size-14 items-center justify-center rounded-2xl bg-white/5 shadow-inner transition-transform duration-300 group-hover:scale-110">
                      @if (isDirectory(item)) {
                        <i class="fa-solid fa-folder text-3xl text-violet-400"></i>
                      } @else if (isVideo(item)) {
                        <i class="fa-solid fa-file-video text-3xl text-violet-300"></i>
                      } @else {
                        <i class="fa-solid fa-file text-3xl text-zinc-400"></i>
                      }
                    </div>
                  }
                </div>

                <!-- Info Area -->
                <div class="flex w-full flex-col gap-0.5 border-t border-white/5 bg-white/5 p-2.5">
                  <span
                    class="truncate text-xs font-medium transition-colors"
                    [class.text-violet-400]="isSelected(item.path)"
                    [class.text-zinc-200]="!isSelected(item.path)"
                    [title]="item.name"
                  >
                    {{ item.name }}
                  </span>
                  <div class="flex items-center justify-between text-[10px] text-zinc-500">
                    <span>{{ itemMeta(item) }}</span>
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </section>
  `,
})
export class FileListComponent {
  readonly items = input<FileItem[]>([]);
  readonly selectedPaths = input<string[]>([]);
  readonly thumbnailUrls = input<Record<string, string>>({});
  readonly page = input<number>(1);
  readonly totalPages = input<number>(1);
  readonly totalItems = input<number>(0);
  readonly isSearchMode = input<boolean>(false);
  /** Path of the parent directory. Pass null/empty when at root. */
  readonly parentPath = input<string | null>(null);

  readonly open = output<FileItem>();
  readonly selectionChange = output<string[]>();
  readonly info = output<string>();
  readonly contextMenu = output<{ event: MouseEvent; item: FileItem }>();
  readonly search = output<SearchFilters>();
  readonly clearSearch = output<void>();
  readonly changePage = output<number>();
  readonly navigateToParent = output<void>();
  readonly moveItems = output<{ sources: string[]; destination: string }>();
  readonly uploadFiles = output<FileList>();

  readonly viewMode = signal<'list' | 'grid'>('list');
  private readonly anchorPath = signal<string | null>(null);

  // -- External drop state ---------------------------------------------------
  private externalDragCounter = 0;
  readonly isExternalDragOver = signal(false);

  private isExternalFileDrag(event: DragEvent): boolean {
    return !!event.dataTransfer?.types.includes('Files') && this.dragPaths().length === 0;
  }

  // Drag state
  private readonly dragPaths = signal<string[]>([]);
  readonly dragOverPath = signal<string | null>(null);
  readonly dragOverParent = signal(false);

  readonly isDragging = computed(() => this.dragPaths().length > 0);
  readonly dragCount = computed(() => this.dragPaths().length);

  readonly showParentRow = computed(
    () => !this.isSearchMode() && !!this.parentPath(),
  );

  isInDrag(path: string): boolean {
    return this.dragPaths().includes(path);
  }

  // Selection
  isSelected(path: string): boolean {
    return this.selectedPaths().includes(path);
  }

  onRowClick(event: MouseEvent, item: FileItem, index: number): void {
    const items = this.items();
    const current = this.selectedPaths();

    if (event.shiftKey && this.anchorPath() !== null) {
      const anchorIndex = items.findIndex((i) => i.path === this.anchorPath());
      const from = Math.min(anchorIndex === -1 ? index : anchorIndex, index);
      const to = Math.max(anchorIndex === -1 ? index : anchorIndex, index);
      const range = items.slice(from, to + 1).map((i) => i.path);

      if (event.ctrlKey || event.metaKey) {
        this.selectionChange.emit(Array.from(new Set([...current, ...range])));
      } else {
        this.selectionChange.emit(range);
      }
    } else if (event.ctrlKey || event.metaKey) {
      const updated = current.includes(item.path)
        ? current.filter((p) => p !== item.path)
        : [...current, item.path];
      this.selectionChange.emit(updated);
      this.anchorPath.set(item.path);
    } else {
      this.selectionChange.emit([item.path]);
      this.anchorPath.set(item.path);
    }
  }

  onRowDblClick(item: FileItem): void {
    this.open.emit(item);
  }

  onRowKeySpace(event: Event, item: FileItem, index: number): void {
    event.preventDefault();
    this.onRowClick(event as unknown as MouseEvent, item, index);
  }

  onCheckboxChange(item: FileItem): void {
    const current = this.selectedPaths();
    const updated = current.includes(item.path)
      ? current.filter((p) => p !== item.path)
      : [...current, item.path];
    this.selectionChange.emit(updated);
    this.anchorPath.set(item.path);
  }

  onDocumentKeyDown(event: KeyboardEvent): void {
    if ((event.ctrlKey || event.metaKey) && event.key === 'a') {
      const target = event.target as HTMLElement;
      // Skip when focus is inside a text input (e.g. the search box)
      if (
        target.tagName === 'TEXTAREA' ||
        (target.tagName === 'INPUT' &&
          (target as HTMLInputElement).type !== 'checkbox' &&
          (target as HTMLInputElement).type !== 'radio')
      ) {
        return;
      }
      // Only intercept if focus is inside this component
      if (!target.closest('app-file-list')) return;
      event.preventDefault();
      this.selectionChange.emit(this.items().map((i) => i.path));
      this.anchorPath.set(this.items()[0]?.path ?? null);
    }
  }

  onContainerClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    // If the click is on a file item (row or card), let that handler take care of it.
    // We only clear selection if clicking on the "empty space" of the container.
    if (!target.closest('[data-file-item]')) {
      this.selectionChange.emit([]);
      this.anchorPath.set(null);
      // Keep focus inside the component so Ctrl+A still works
      (event.currentTarget as HTMLElement).focus();
    }
  }

  onContextMenu(event: MouseEvent, item: FileItem): void {
    event.preventDefault();
    this.contextMenu.emit({ event, item });
  }

  onContextMenuButton(event: MouseEvent, item: FileItem): void {
    // Position at the button itself so the menu appears below it
    this.contextMenu.emit({ event, item });
  }

  // -- External file upload drag & drop -------------------------------------
  onExternalDragEnter(event: DragEvent): void {
    if (!this.isExternalFileDrag(event)) return;
    this.externalDragCounter++;
    this.isExternalDragOver.set(true);
  }

  onExternalDragOver(event: DragEvent): void {
    if (!this.isExternalFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'copy';
  }

  onExternalDragLeave(event: DragEvent): void {
    if (!event.dataTransfer?.types.includes('Files')) return;
    this.externalDragCounter--;
    if (this.externalDragCounter <= 0) {
      this.externalDragCounter = 0;
      this.isExternalDragOver.set(false);
    }
  }

  onExternalDrop(event: DragEvent): void {
    if (!this.isExternalFileDrag(event)) return;
    event.preventDefault();
    event.stopPropagation();
    this.externalDragCounter = 0;
    this.isExternalDragOver.set(false);
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFiles.emit(files);
    }
  }

  // -- Drag & Drop --------------------------------------
  onDragStart(event: DragEvent, item: FileItem): void {
    // If the dragged item is among the selection, drag all selected; otherwise drag only this item
    const selected = this.selectedPaths();
    const paths = selected.includes(item.path) ? selected : [item.path];
    this.dragPaths.set(paths);

    event.dataTransfer?.setData('text/plain', paths.join('\n'));
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragEnd(): void {
    this.dragPaths.set([]);
    this.dragOverPath.set(null);
    this.dragOverParent.set(false);
  }

  onDragOver(event: DragEvent, item: FileItem): void {
    // External file drag - let it bubble to the section drop zone
    if (this.dragPaths().length === 0) return;
    if (!this.isDirectory(item)) return;
    if (this.dragPaths().includes(item.path)) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverPath.set(item.path);
    this.dragOverParent.set(false);
  }

  onDragLeave(event: DragEvent, item: FileItem): void {
    if (!this.isDirectory(item)) return;
    const related = event.relatedTarget as HTMLElement | null;
    const row = (event.currentTarget as HTMLElement);
    if (!related || !row.contains(related)) {
      if (this.dragOverPath() === item.path) {
        this.dragOverPath.set(null);
      }
    }
  }

  onDrop(event: DragEvent, item: FileItem): void {
    // External file drag - let it bubble to the section drop zone
    if (this.dragPaths().length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (!this.isDirectory(item)) return;
    const sources = this.dragPaths();
    if (sources.includes(item.path)) return;
    this.moveItems.emit({ sources, destination: item.path });
    this.dragPaths.set([]);
    this.dragOverPath.set(null);
  }

  onDragOverParent(event: DragEvent): void {
    if (this.dragPaths().length === 0) return;
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer) event.dataTransfer.dropEffect = 'move';
    this.dragOverParent.set(true);
    this.dragOverPath.set(null);
  }

  onDragLeaveParent(): void {
    this.dragOverParent.set(false);
  }

  onDropOnParent(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    const parent = this.parentPath();
    const sources = this.dragPaths();
    if (!parent || sources.length === 0) return;
    this.moveItems.emit({ sources, destination: parent });
    this.dragPaths.set([]);
    this.dragOverParent.set(false);
  }

  // -- Helpers --------------------------------------
  isDirectory(item: FileItem): boolean {
    const normalizedType = item.type.trim().toLowerCase();
    return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
  }

  isImage(item: FileItem): boolean {
    if (this.isDirectory(item)) return false;
    if (item.is_image === true) return true;
    return item.mime_type?.startsWith('image/') ?? false;
  }

  isVideo(item: FileItem): boolean {
    if (this.isDirectory(item)) return false;
    if (item.is_video === true) return true;
    return item.mime_type?.startsWith('video/') ?? false;
  }

  isMedia(item: FileItem): boolean {
    return this.isImage(item) || this.isVideo(item);
  }

  thumbnailUrl(path: string): string | undefined {
    return this.thumbnailUrls()[path];
  }

  itemMeta(item: FileItem): string {
    if (this.isDirectory(item)) {
      const count = item.item_count;
      if (typeof count === 'number') {
        return count === 1 ? '1 item' : `${count} items`;
      }
      return '-';
    }
    return item.size_human ?? `${item.size}`;
  }

  private readonly dateFormatter = new Intl.DateTimeFormat('es', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  formatDate(value: string | undefined): string {
    if (!value) return '-';
    const date = new Date(value);
    return isNaN(date.getTime()) ? '-' : this.dateFormatter.format(date);
  }
}
