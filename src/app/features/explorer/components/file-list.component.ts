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
      class="relative flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl"
      (dragenter)="onExternalDragEnter($event)"
      (dragover)="onExternalDragOver($event)"
      (dragleave)="onExternalDragLeave($event)"
      (drop)="onExternalDrop($event)"
    >
      <header class="flex shrink-0 flex-col gap-4 border-b border-white/5 bg-white/5 p-4">
        <app-search-panel (search)="search.emit($event)" (clearFilters)="clearSearch.emit()" />

        <!-- External file drop overlay -->
        @if (isExternalDragOver()) {
          <div
            class="pointer-events-none absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-sky-400 bg-slate-900/80 backdrop-blur-sm"
            aria-hidden="true"
          >
            <i class="fa-solid fa-cloud-arrow-up text-5xl text-sky-400"></i>
            <p class="text-lg font-semibold text-sky-300">Suelta para subir archivos</p>
            <p class="text-sm text-slate-400">Se subirán a la carpeta actual</p>
          </div>
        }

        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-table-list text-sky-400"></i>
            <h2 class="text-sm font-semibold text-slate-200">
              {{ isSearchMode() ? 'Resultados de búsqueda' : 'Contenido' }}
            </h2>
            <span class="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {{ totalItems() }} items
            </span>
            @if (selectedPaths().length > 1) {
              <span class="rounded-full bg-sky-500/20 px-2.5 py-0.5 text-xs font-medium text-sky-300">
                {{ selectedPaths().length }} seleccionados
              </span>
            }
            @if (isDragging()) {
              <span class="rounded-full bg-amber-500/20 px-2.5 py-0.5 text-xs font-medium text-amber-300">
                <i class="fa-solid fa-hand-pointer mr-1"></i>
                Arrastrando {{ dragCount() }} {{ dragCount() === 1 ? 'elemento' : 'elementos' }}
              </span>
            }
          </div>

          <div class="flex items-center gap-3">
            <span class="text-xs text-slate-400">
              Página {{ page() }} de {{ totalPages() }}
            </span>
            <div class="flex gap-1">
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-slate-300"
                [disabled]="page() <= 1"
                (click)="changePage.emit(-1)"
                aria-label="Página anterior"
              >
                <i class="fa-solid fa-chevron-left text-xs"></i>
              </button>
              <button
                type="button"
                class="flex size-7 items-center justify-center rounded-lg bg-white/5 text-slate-300 transition-all hover:bg-white/10 hover:text-white disabled:opacity-50 disabled:hover:bg-white/5 disabled:hover:text-slate-300"
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
        <table class="w-full table-fixed text-left text-sm">
          <colgroup>
            <col style="width:2.5rem" />
            <col style="width:35%" />
            <col style="width:7rem" />
            <col style="width:10rem" />
            <col style="width:10rem" />
            <col style="width:5.5rem" />
          </colgroup>
          <thead class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
            <tr class="border-b border-white/5 text-xs font-medium text-slate-400">
              <th class="px-4 py-3" aria-label="Selección"></th>
              <th class="px-4 py-3">Nombre</th>
              <th class="px-4 py-3">Tamaño</th>
              <th class="px-4 py-3">Modificado</th>
              <th class="px-4 py-3">Creado</th>
              <th class="px-4 py-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-white/5">

            <!-- Parent (..) row always first, only outside search mode -->
            @if (showParentRow()) {
              <tr
                class="group cursor-pointer select-none transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-sky-500"
                [class.ring-2]="dragOverParent()"
                [class.ring-inset]="dragOverParent()"
                [class.ring-sky-400]="dragOverParent()"
                [class.bg-sky-500/10]="dragOverParent()"
                tabindex="0"
                aria-label="Carpeta superior"
                (dblclick)="navigateToParent.emit()"
                (keydown.enter)="navigateToParent.emit()"
                (dragover)="onDragOverParent($event)"
                (dragleave)="onDragLeaveParent()"
                (drop)="onDropOnParent($event)"
              >
                <td class="px-4 py-3"></td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-3">
                    <div class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/5">
                      <i class="fa-solid fa-folder-open text-slate-400"></i>
                    </div>
                    <span class="font-medium text-slate-400 transition-colors group-hover:text-slate-200">..</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-slate-500">-</td>
                <td class="px-4 py-3 text-slate-500">-</td>
                <td class="px-4 py-3 text-slate-500">-</td>
                <td class="px-4 py-3"></td>
              </tr>
            }

            @if (items().length === 0 && !showParentRow()) {
              <tr>
                <td colspan="6">
                  <div class="flex flex-col items-center justify-center p-8 text-center opacity-50">
                    <i class="fa-solid fa-folder-open mb-3 text-5xl text-slate-400"></i>
                    <p class="text-sm text-slate-400">No hay elementos para mostrar en esta carpeta.</p>
                  </div>
                </td>
              </tr>
            }

            @if (items().length === 0 && showParentRow()) {
              <tr>
                <td colspan="6">
                  <div class="flex flex-col items-center justify-center p-6 text-center opacity-50">
                    <p class="text-sm text-slate-400">La carpeta está vacía.</p>
                  </div>
                </td>
              </tr>
            }

            @for (item of items(); track item.path; let idx = $index) {
              <tr
                class="group cursor-pointer select-none transition-colors hover:bg-white/5 focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-sky-500"
                [class.bg-sky-500/10]="isSelected(item.path)"
                [class.opacity-40]="isDragging() && isInDrag(item.path)"
                [class.ring-2]="isDirectory(item) && dragOverPath() === item.path"
                [class.ring-inset]="isDirectory(item) && dragOverPath() === item.path"
                [class.ring-sky-400]="isDirectory(item) && dragOverPath() === item.path"
                [class.bg-sky-500/15]="isDirectory(item) && dragOverPath() === item.path"
                tabindex="0"
                draggable="true"
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
                <td class="px-4 py-3">
                  <div class="flex items-center justify-center">
                    <input
                      type="checkbox"
                      class="size-4 cursor-pointer rounded border-white/20 bg-white/5 text-sky-500 transition-all focus:ring-sky-500/50 focus:ring-offset-0"
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
                <td class="overflow-hidden px-4 py-3">
                  <div class="flex min-w-0 items-center gap-3">
                    <div class="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white/5 shadow-inner">
                      @if (isImage(item) && thumbnailUrl(item.path)) {
                        <img
                          [src]="thumbnailUrl(item.path)"
                          [alt]="item.name"
                          class="size-full object-cover transition-transform duration-300 group-hover:scale-110"
                          loading="lazy"
                        />
                      } @else {
                        @if (isDirectory(item)) {
                          <i class="fa-solid fa-folder text-sky-400"></i>
                        } @else {
                          <i class="fa-solid fa-file text-slate-400"></i>
                        }
                      }
                    </div>
                    <span
                      class="min-w-0 truncate font-medium transition-colors"
                      [class.text-sky-400]="isSelected(item.path)"
                      [class.text-slate-200]="!isSelected(item.path)"
                    >
                      {{ item.name }}
                    </span>
                  </div>
                </td>

                <td class="px-4 py-3 text-slate-400">{{ itemMeta(item) }}</td>
                <td class="px-4 py-3 text-slate-400">{{ formatDate(item.modified_at) }}</td>
                <td class="px-4 py-3 text-slate-400">{{ formatDate(item.created_at) }}</td>

                <td class="px-3 py-3">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      type="button"
                      class="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white"
                      (click)="$event.stopPropagation(); onContextMenuButton($event, item)"
                      aria-label="Más opciones"
                      title="Más opciones"
                    >
                      <i class="fa-solid fa-ellipsis-vertical text-xs"></i>
                    </button>
                    <button
                      type="button"
                      class="inline-flex size-7 items-center justify-center rounded-lg text-slate-400 transition-all hover:bg-white/10 hover:text-white"
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

  private readonly anchorPath = signal<string | null>(null);

  // ── External drop state ───────────────────────────────────────────────────
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
    if (!target.closest('tr')) {
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

  // ── External file upload drag & drop ─────────────────────────────────────
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

  // ── Drag & Drop ──────────────────────────────────────
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
    // External file drag — let it bubble to the section drop zone
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
    // External file drag — let it bubble to the section drop zone
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

  // ── Helpers ──────────────────────────────────────
  isDirectory(item: FileItem): boolean {
    const normalizedType = item.type.trim().toLowerCase();
    return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
  }

  isImage(item: FileItem): boolean {
    if (this.isDirectory(item)) return false;
    if (item.is_image === true) return true;
    return item.mime_type?.startsWith('image/') ?? false;
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
