import { ChangeDetectionStrategy, Component, output } from '@angular/core';

@Component({
  selector: 'app-explorer-toolbar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="flex items-center gap-2">
      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 transition-all hover:bg-white/10 hover:text-white"
        (click)="refreshClick.emit()"
      >
        <i class="fa-solid fa-rotate-right"></i>
        Recargar
      </button>

      <div class="h-4 w-px bg-white/10 mx-1"></div>

      <button
        type="button"
        class="flex items-center gap-2 rounded-lg bg-sky-500/20 px-3 py-1.5 text-xs font-medium text-sky-400 transition-all hover:bg-sky-500/30 hover:text-sky-300"
        (click)="newDirectoryClick.emit()"
      >
        <i class="fa-solid fa-folder-plus"></i>
        Nueva carpeta
      </button>

      <div class="h-4 w-px bg-white/10 mx-1"></div>

      <label class="flex cursor-pointer items-center gap-2 rounded-lg bg-sky-500 px-3 py-1.5 text-xs font-medium text-white transition-all hover:bg-sky-400 active:scale-95">
        <i class="fa-solid fa-cloud-arrow-up"></i>
        Subir
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
