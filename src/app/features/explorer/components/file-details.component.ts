import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FileItem } from '../../../core/models/api.models';
import { isDirectory, getFileIconClass, getFileIconColorClass } from '../../../shared/utils/file-item.utils';

@Component({
  selector: 'app-file-details',
  imports: [DatePipe, DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <aside class="flex h-full w-full flex-col overflow-hidden rounded-2xl border border-white/5 bg-zinc-900/40 shadow-xl backdrop-blur-2xl ring-1 ring-white/5">
      <header class="flex items-center justify-between border-b border-white/5 bg-white/5 px-5 py-4">
        <h3 class="text-sm font-bold tracking-wide text-zinc-100">Details</h3>
        <button
          type="button"
          class="flex size-8 items-center justify-center rounded-lg text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
          (click)="close.emit()"
          aria-label="Close details"
        >
          <i class="fa-solid fa-xmark"></i>
        </button>
      </header>

      <div class="flex-1 overflow-y-auto p-5 custom-scrollbar">
        @if (item()) {
          <div class="flex flex-col items-center text-center mb-8">
            <div class="relative flex size-32 items-center justify-center rounded-3xl bg-white/5 mb-4 shadow-2xl ring-1 ring-white/10 overflow-hidden group">
              @if (thumbnailUrl()) {
                <img [src]="thumbnailUrl()" [alt]="item()?.name" class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
              } @else {
                <i class="fa-solid text-5xl text-zinc-500 transition-colors group-hover:text-zinc-400" [class]="getIconClass(item()!)"></i>
              }
            </div>
            <h4 class="text-lg font-bold text-zinc-100 break-all line-clamp-2 px-2" [title]="item()?.name">{{ item()?.name }}</h4>
            <p class="text-sm font-medium text-zinc-500 mt-1">{{ item()?.type === 'dir' ? 'Folder' : (item()?.extension || 'File') }}</p>
          </div>

          <div class="space-y-6">
            <div class="space-y-3">
              <h5 class="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Information</h5>
              <div class="rounded-2xl bg-white/5 p-4 ring-1 ring-white/5 space-y-3">
                <div class="flex justify-between items-center gap-2">
                  <dt class="text-xs text-zinc-400">Size</dt>
                  <dd class="text-sm text-zinc-200 font-medium">{{ item()?.type === 'dir' ? '-' : (item()?.size_human || (item()?.size | number) + ' B') }}</dd>
                </div>
                <div class="w-full h-px bg-white/5"></div>
                <div class="flex justify-between items-center gap-2">
                  <dt class="text-xs text-zinc-400">Modified</dt>
                  <dd class="text-sm text-zinc-200 font-medium">{{ item()?.modified_at | date:'mediumDate' }}</dd>
                </div>
                <div class="w-full h-px bg-white/5"></div>
                <div class="flex justify-between items-center gap-2">
                  <dt class="text-xs text-zinc-400">Created</dt>
                  <dd class="text-sm text-zinc-200 font-medium">{{ item()?.created_at | date:'mediumDate' }}</dd>
                </div>
              </div>
            </div>

            <div class="space-y-3">
              <h5 class="text-xs font-bold text-zinc-500 uppercase tracking-wider px-1">Actions</h5>
              <div class="grid gap-2">
                <button
                  type="button"
                  class="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white hover:shadow-lg border border-white/5 hover:border-white/10 text-left group"
                  (click)="open.emit(item()!)"
                >
                  <div class="flex size-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                    <i class="fa-solid" [class.fa-folder-open]="item()?.type === 'dir'" [class.fa-arrow-up-right-from-square]="item()?.type !== 'dir'"></i>
                  </div>
                  <span>Open</span>
                </button>
                
                @if (item()?.type === 'file') {
                  <button
                    type="button"
                    class="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white hover:shadow-lg border border-white/5 hover:border-white/10 text-left group"
                    (click)="download.emit(item()!)"
                  >
                    <div class="flex size-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                      <i class="fa-solid fa-download"></i>
                    </div>
                    <span>Download</span>
                  </button>
                }

                @if (item() && isZip(item()!)) {
                  <button
                    type="button"
                    class="flex items-center gap-3 rounded-xl bg-zinc-800/50 px-4 py-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white hover:shadow-lg border border-white/5 hover:border-white/10 text-left group"
                    (click)="decompress.emit(item()!)"
                  >
                    <div class="flex size-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400 group-hover:text-white transition-colors">
                      <i class="fa-solid fa-box-open"></i>
                    </div>
                    <span>Extract Here</span>
                  </button>
                }
                
                <div class="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    class="flex flex-col items-center justify-center gap-2 rounded-xl bg-zinc-800/50 p-3 text-sm font-medium text-zinc-200 transition-all hover:bg-zinc-700 hover:text-white hover:shadow-lg border border-white/5 hover:border-white/10 group"
                    (click)="rename.emit(item()!)"
                  >
                    <i class="fa-solid fa-pen-to-square text-zinc-400 group-hover:text-white transition-colors"></i>
                    <span class="text-xs">Rename</span>
                  </button>
                  
                  <button
                    type="button"
                    class="flex flex-col items-center justify-center gap-2 rounded-xl bg-red-500/10 p-3 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20 hover:text-red-300 hover:shadow-lg border border-red-500/10 hover:border-red-500/20 group"
                    (click)="delete.emit(item()!)"
                  >
                    <i class="fa-solid fa-trash-can transition-colors"></i>
                    <span class="text-xs">Delete</span>
                  </button>
                </div>
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
  readonly decompress = output<FileItem>();

  isZip(item: FileItem): boolean {
    return item.name.toLowerCase().endsWith('.zip');
  }

  getIconClass(item: FileItem): string {
    return `${getFileIconClass(item)} ${getFileIconColorClass(item)}`;
  }
}
