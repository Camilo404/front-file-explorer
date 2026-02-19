import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-explorer-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-1 sm:gap-2">
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-white/5 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white sm:px-3"
        title="Recargar"
        aria-label="Recargar"
        (click)="refreshClick.emit()"
      >
        <i class="fa-solid fa-rotate-right"></i>
        <span class="hidden sm:inline">Recargar</span>
      </button>

      <div class="h-4 w-px bg-white/10 hidden sm:block"></div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-sky-500/20 px-2.5 py-1.5 text-xs font-medium text-sky-400 transition-all hover:bg-sky-500/30 hover:text-sky-300 sm:px-3"
        title="Nueva carpeta"
        aria-label="Nueva carpeta"
        (click)="newDirectoryClick.emit()"
      >
        <i class="fa-solid fa-folder-plus"></i>
        <span class="hidden sm:inline">Nueva carpeta</span>
      </button>

      <div class="h-4 w-px bg-white/10 hidden sm:block"></div>

      <label
        class="flex cursor-pointer items-center gap-2 rounded-lg bg-sky-500 px-2.5 py-1.5 text-xs font-medium text-white transition-all hover:bg-sky-400 active:scale-95 sm:px-3"
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
