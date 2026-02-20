import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

export interface SearchFilters {
  q: string;
  type?: 'file' | 'dir';
  ext?: string;
}

@Component({
  selector: 'app-search-panel',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form class="flex flex-col gap-3 sm:flex-row sm:items-center" [formGroup]="form" (ngSubmit)="onSearch()">
      <div class="flex flex-1 gap-2">
        <div class="relative flex-1">
          <i class="fa-solid fa-magnifying-glass absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
          <input
            type="text"
            formControlName="q"
            placeholder="Buscar archivos o carpetas..."
            class="w-full rounded-xl border border-white/10 bg-white/5 shadow-inner py-2 pl-10 pr-4 text-sm text-zinc-200 placeholder-zinc-400 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>

        <div class="relative w-24">
          <input
            type="text"
            formControlName="ext"
            placeholder=".ext"
            class="w-full rounded-xl border border-white/10 bg-white/5 shadow-inner px-3 py-2 text-sm text-zinc-200 placeholder-zinc-400 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
          />
        </div>
      </div>

      <div class="flex gap-2 sm:w-auto">
        <div class="relative w-36">
          <i class="fa-solid fa-filter absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"></i>
          <select formControlName="type" class="w-full appearance-none rounded-xl border border-white/10 bg-white/5 shadow-inner py-2 pl-9 pr-8 text-sm text-zinc-200 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50">
            <option value="" class="bg-zinc-800">Cualquiera</option>
            <option value="file" class="bg-zinc-800">Archivo</option>
            <option value="dir" class="bg-zinc-800">Carpeta</option>
          </select>
          <i class="fa-solid fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 pointer-events-none"></i>
        </div>
      </div>

      <div class="flex gap-2 sm:w-auto">
        <button type="submit" class="flex items-center justify-center gap-2 rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white transition-all hover:bg-violet-400 active:scale-95">
          Buscar
        </button>
        <button type="button" class="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 shadow-inner px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white active:scale-95" (click)="clear()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </form>
  `,
})
export class SearchPanelComponent {
  readonly disabled = input(false);
  readonly search = output<SearchFilters>();
  readonly clearFilters = output<void>();

  private readonly fb = new FormBuilder();

  readonly form = this.fb.nonNullable.group({
    q: '',
    type: '',
    ext: '',
  });

  onSearch(): void {
    if (this.disabled()) {
      return;
    }

    const raw = this.form.getRawValue();
    this.search.emit({
      q: raw.q.trim(),
      type: (raw.type as 'file' | 'dir' | '') || undefined,
      ext: raw.ext.trim() || undefined,
    });
  }

  clear(): void {
    this.form.reset({ q: '', type: '', ext: '' });
    this.clearFilters.emit();
  }
}
