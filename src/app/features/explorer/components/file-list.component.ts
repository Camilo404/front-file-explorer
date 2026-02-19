import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

import { FileItem } from '../../../core/models/api.models';

@Component({
  selector: 'app-file-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded border border-slate-800 bg-slate-900 p-3">
      <header class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold">Contenido</h2>
        <span class="text-xs text-slate-400">{{ items().length }} items</span>
      </header>

      @if (items().length === 0) {
        <p class="text-sm text-slate-400">No hay elementos para mostrar.</p>
      } @else {
        <div class="overflow-auto">
          <table class="min-w-full text-left text-xs">
            <thead>
              <tr class="border-b border-slate-800 text-slate-300">
                <th class="px-2 py-2"></th>
                <th class="px-2 py-2">Nombre</th>
                <th class="px-2 py-2">Items/Size</th>
                <th class="px-2 py-2">Modificado</th>
                <th class="px-2 py-2">Creado</th>
                <th class="px-2 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              @for (item of items(); track item.path) {
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/40">
                  <td class="px-2 py-2 align-top">
                    <input
                      type="checkbox"
                      [checked]="selectedPaths().includes(item.path)"
                      (change)="toggleSelection.emit(item.path)"
                      [attr.aria-label]="'Select ' + item.name"
                    />
                  </td>

                  <td class="px-2 py-2 align-top">
                    <div class="flex items-center gap-2">
                      <span class="inline-flex h-8 w-8 items-center justify-center overflow-hidden rounded bg-slate-950">
                        @if (isImage(item) && thumbnailUrl(item.path)) {
                          <img
                            [src]="thumbnailUrl(item.path)"
                            [alt]="item.name"
                            class="h-8 w-8 object-cover"
                            loading="lazy"
                          />
                        } @else {
                          <span>{{ isDirectory(item) ? '📁' : '📄' }}</span>
                        }
                      </span>
                      <button
                        type="button"
                        class="max-w-56 truncate text-left text-sky-300 hover:text-sky-200"
                        (click)="open.emit(item)"
                        [attr.aria-label]="'Open ' + item.name"
                      >
                        {{ item.name }}
                      </button>
                    </div>
                  </td>

                  <td class="px-2 py-2 align-top">{{ itemMeta(item) }}</td>
                  <td class="px-2 py-2 align-top">{{ item.modified_at || '-' }}</td>
                  <td class="px-2 py-2 align-top">{{ item.created_at || '-' }}</td>
                  <td class="px-2 py-2 align-top">
                    <button
                      type="button"
                      class="rounded bg-slate-700 px-2 py-1 hover:bg-slate-600"
                      (click)="info.emit(item.path)"
                    >
                      Info
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

  readonly open = output<FileItem>();
  readonly toggleSelection = output<string>();
  readonly info = output<string>();

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
}
