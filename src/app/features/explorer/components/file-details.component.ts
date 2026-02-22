import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FileItem } from '../../../core/models/api.models';
import { isDirectory, getFileIconClass, getFileIconColorClass } from '../../../shared/utils/file-item.utils';

@Component({
  selector: 'app-file-details',
  imports: [DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="flex h-full w-72 flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
      <header class="flex items-center justify-between border-b border-white/5 bg-white/5 px-4 py-3">
        <h3 class="text-sm font-bold tracking-wide text-zinc-100">Detalles</h3>
        <button
          type="button"
          class="flex size-7 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
          (click)="close.emit()"
          aria-label="Cerrar detalles"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-4 custom-scrollbar">
        @if (item()) {
          <div class="flex flex-col items-center text-center mb-6">
            <div class="flex size-24 items-center justify-center rounded-2xl bg-white/5 mb-3 shadow-inner ring-1 ring-white/10 overflow-hidden">
              @if (thumbnailUrl()) {
                <img [src]="thumbnailUrl()" [alt]="item()?.name" class="h-full w-full object-cover" />
              } @else {
                <i class="fa-solid text-4xl text-zinc-400" [class]="getIconClass(item()!)"></i>
              }
            </div>
            <h4 class="text-base font-semibold text-zinc-100 break-all line-clamp-2" [title]="item()?.name">{{ item()?.name }}</h4>
            <p class="text-xs text-zinc-400 mt-1">{{ item()?.type === 'dir' ? 'Carpeta' : (item()?.extension || 'Archivo') }}</p>
          </div>

          <div class="space-y-4">
            <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
              <h5 class="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Información</h5>
              <dl class="space-y-2 text-sm">
                <div class="flex justify-between gap-2">
                  <dt class="text-zinc-500">Tamaño</dt>
                  <dd class="text-zinc-200 font-medium text-right">{{ item()?.type === 'dir' ? '-' : (item()?.size_human || (item()?.size | number) + ' B') }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-zinc-500">Modificado</dt>
                  <dd class="text-zinc-200 font-medium text-right">{{ item()?.modified_at | date:'short' }}</dd>
                </div>
                <div class="flex justify-between gap-2">
                  <dt class="text-zinc-500">Creado</dt>
                  <dd class="text-zinc-200 font-medium text-right">{{ item()?.created_at | date:'short' }}</dd>
                </div>
              </dl>
            </div>

            <div class="rounded-xl bg-white/5 p-3 ring-1 ring-white/5">
              <h5 class="text-xs font-semibold text-zinc-300 mb-2 uppercase tracking-wider">Acciones</h5>
              <div class="flex flex-col gap-1.5">
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white text-left"
                  (click)="open.emit(item()!)"
                >
                  <i class="fa-solid w-4 text-center" [class.fa-folder-open]="item()?.type === 'dir'" [class.fa-arrow-up-right-from-square]="item()?.type !== 'dir'"></i>
                  Abrir
                </button>
                @if (item()?.type === 'file') {
                  <button
                    type="button"
                    class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white text-left"
                    (click)="download.emit(item()!)"
                  >
                    <i class="fa-solid fa-download w-4 text-center"></i>
                    Descargar
                  </button>
                }
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-zinc-300 transition-colors hover:bg-white/10 hover:text-white text-left"
                  (click)="rename.emit(item()!)"
                >
                  <i class="fa-solid fa-pen-to-square w-4 text-center"></i>
                  Renombrar
                </button>
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-red-400 transition-colors hover:bg-red-500/10 hover:text-red-300 text-left"
                  (click)="delete.emit(item()!)"
                >
                  <i class="fa-solid fa-trash-can w-4 text-center"></i>
                  Eliminar
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </aside>
  `,
})
export class FileDetailsComponent {
  readonly item = input<FileItem | null>(null);
  readonly thumbnailUrl = input<string | undefined>(undefined);
  
  readonly close = output<void>();
  readonly open = output<FileItem>();
  readonly download = output<FileItem>();
  readonly rename = output<FileItem>();
  readonly delete = output<FileItem>();

  getIconClass(item: FileItem): string {
    return `${getFileIconClass(item)} ${getFileIconColorClass(item)}`;
  }
}
