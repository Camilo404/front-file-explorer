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
    <form class="grid gap-2 rounded border border-slate-800 bg-slate-900 p-3 md:grid-cols-6" [formGroup]="form" (ngSubmit)="onSearch()">
      <input
        type="text"
        formControlName="q"
        placeholder="Buscar..."
        class="rounded border border-slate-700 bg-slate-950 px-3 py-2 md:col-span-3"
      />

      <select formControlName="type" class="rounded border border-slate-700 bg-slate-950 px-3 py-2">
        <option value="">Tipo</option>
        <option value="file">Archivo</option>
        <option value="dir">Directorio</option>
      </select>

      <input
        type="text"
        formControlName="ext"
        placeholder="Ext (.txt)"
        class="rounded border border-slate-700 bg-slate-950 px-3 py-2"
      />

      <div class="flex gap-2">
        <button type="submit" class="w-full rounded bg-blue-600 px-3 py-2 text-sm hover:bg-blue-500">Buscar</button>
        <button type="button" class="w-full rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600" (click)="clear()">Limpiar</button>
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
