import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-explorer-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2 sm:gap-3">
      <button
        type="button"
        class="flex items-center gap-2.5 rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition-all hover:bg-white/10 hover:text-white hover:shadow-md sm:px-4"
        title="Recargar"
        aria-label="Recargar"
        (click)="refreshClick.emit()"
      >
        <i class="fa-solid fa-rotate-right"></i>
        <span class="hidden sm:inline">Recargar</span>
      </button>

      <div class="h-5 w-px bg-white/10 hidden sm:block"></div>

      <button
        type="button"
        class="flex items-center gap-2.5 rounded-xl bg-violet-500/15 px-3 py-2 text-xs font-semibold text-violet-300 transition-all hover:bg-violet-500/25 hover:text-violet-200 hover:shadow-md sm:px-4 ring-1 ring-violet-500/30"
        title="Nueva carpeta"
        aria-label="Nueva carpeta"
        (click)="newDirectoryClick.emit()"
      >
        <i class="fa-solid fa-folder-plus"></i>
        <span class="hidden sm:inline">Nueva carpeta</span>
      </button>

      <div class="h-5 w-px bg-white/10 hidden sm:block"></div>

      <label
        class="flex cursor-pointer items-center gap-2.5 rounded-xl bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition-all hover:bg-violet-500 hover:shadow-lg hover:shadow-violet-500/25 active:scale-95 sm:px-4 ring-1 ring-violet-500/50"
        title="Subir archivos"
        aria-label="Subir archivos"
      >
        <i class="fa-solid fa-cloud-arrow-up"></i>
        <span class="hidden sm:inline">Subir</span>
        <input type="file" class="hidden" multiple (change)="onUpload($event)" />
      </label>
    </div>
  `,
})
export class ExplorerToolbarComponent {
  readonly refreshClick = output<void>();
  readonly newDirectoryClick = output<void>();
  readonly uploadFiles = output<FileList>();

  onUpload(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.uploadFiles.emit(input.files);
    }
  }
}
