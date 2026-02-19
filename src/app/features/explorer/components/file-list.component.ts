import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FileItem } from '../../../core/models/api.models';
import { SearchFilters, SearchPanelComponent } from './search-panel.component';

@Component({
  selector: 'app-file-list',
  imports: [SearchPanelComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="flex h-full flex-col overflow-hidden rounded-xl border border-white/10 bg-slate-900/50 shadow-2xl backdrop-blur-xl">
      <header class="flex shrink-0 flex-col gap-4 border-b border-white/5 bg-white/5 p-4">
        <app-search-panel (search)="search.emit($event)" (clearFilters)="clearSearch.emit()" />
        
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <i class="fa-solid fa-table-list text-sky-400"></i>
            <h2 class="text-sm font-semibold text-slate-200">
              {{ isSearchMode() ? 'Resultados de búsqueda' : 'Contenido' }}
            </h2>
            <span class="ml-2 rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-slate-300">
              {{ totalItems() }} items
            </span>
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

      @if (items().length === 0) {
        <div class="flex flex-1 flex-col items-center justify-center p-8 text-center opacity-50">
          <i class="fa-solid fa-folder-open mb-3 text-5xl text-slate-400"></i>
          <p class="text-sm text-slate-400">No hay elementos para mostrar en esta carpeta.</p>
        </div>
      } @else {
        <div class="flex-1 overflow-auto custom-scrollbar">
          <table class="w-full min-w-[600px] text-left text-sm">
            <thead class="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md">
              <tr class="border-b border-white/5 text-xs font-medium text-slate-400">
                <th class="w-10 px-4 py-3">
                  <!-- Checkbox header placeholder -->
                </th>
                <th class="px-4 py-3">Nombre</th>
                <th class="px-4 py-3">Tamaño</th>
                <th class="px-4 py-3">Modificado</th>
                <th class="px-4 py-3">Creado</th>
                <th class="w-16 px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-white/5">
              @for (item of items(); track item.path) {
                <tr class="group transition-colors hover:bg-white/5"
                    [class.bg-sky-500/10]="selectedPaths().includes(item.path)"
                    (contextmenu)="onContextMenu($event, item)">
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center">
                      <input
                        type="checkbox"
                        class="size-4 cursor-pointer rounded border-white/20 bg-white/5 text-sky-500 transition-all focus:ring-sky-500/50 focus:ring-offset-0"
                        [checked]="selectedPaths().includes(item.path)"
                        (change)="toggleSelection.emit(item.path)"
                        [attr.aria-label]="'Select ' + item.name"
                      />
                    </div>
                  </td>

                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
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
                      <button
                        type="button"
                        class="max-w-[200px] truncate text-left font-medium text-slate-200 transition-colors hover:text-sky-400 sm:max-w-[300px]"
                        (click)="open.emit(item)"
                        [attr.aria-label]="'Open ' + item.name"
                      >
                        {{ item.name }}
                      </button>
                    </div>
                  </td>

                  <td class="px-4 py-3 text-slate-400">{{ itemMeta(item) }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ item.modified_at || '-' }}</td>
                  <td class="px-4 py-3 text-slate-400">{{ item.created_at || '-' }}</td>
                  <td class="px-4 py-3 text-right">
                    <button
                      type="button"
                      class="inline-flex size-8 items-center justify-center rounded-lg text-slate-400 opacity-0 transition-all hover:bg-white/10 hover:text-white group-hover:opacity-100 focus:opacity-100"
                      (click)="info.emit(item.path)"
                      aria-label="Información"
                      title="Información"
                    >
                      <i class="fa-solid fa-circle-info"></i>
                    </button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
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

  readonly open = output<FileItem>();
  readonly toggleSelection = output<string>();
  readonly info = output<string>();
  readonly contextMenu = output<{ event: MouseEvent; item: FileItem }>();
  readonly search = output<SearchFilters>();
  readonly clearSearch = output<void>();
  readonly changePage = output<number>();

  isDirectory(item: FileItem): boolean {
    const normalizedType = item.type.trim().toLowerCase();
    return normalizedType === 'dir' || normalizedType === 'directory' || normalizedType === 'folder';
  }

  isImage(item: FileItem): boolean {
    if (this.isDirectory(item)) {
      return false;
    }

    if (item.is_image === true) {
      return true;
    }

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

  onContextMenu(event: MouseEvent, item: FileItem): void {
    event.preventDefault();
    this.contextMenu.emit({ event, item });
  }
}
