import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { ConflictPolicy } from '../../../core/api/operations-api.service';

export interface OperationPayload {
  destination: string;
  conflictPolicy: ConflictPolicy;
}

@Component({
  selector: 'app-operations-panel',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="rounded border border-slate-800 bg-slate-900 p-3">
      <h2 class="mb-2 text-sm font-semibold">Operaciones</h2>
      <p class="mb-3 text-xs text-slate-400">Seleccionados: {{ selectedCount() }}</p>

      <form class="grid gap-2 md:grid-cols-6" [formGroup]="form">
        <input
          type="text"
          formControlName="destination"
          placeholder="Destino absoluto (ej: /folder)"
          class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm md:col-span-3"
        />

        <select formControlName="conflictPolicy" class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm">
          <option value="rename">rename</option>
          <option value="overwrite">overwrite</option>
          <option value="skip">skip</option>
        </select>

        <input
          type="text"
          formControlName="newName"
          placeholder="Nuevo nombre"
          class="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
        />

        <button type="button" class="rounded bg-slate-700 px-3 py-2 text-sm hover:bg-slate-600" (click)="refresh.emit()">Refresh</button>
      </form>

      <div class="mt-3 grid gap-2 md:grid-cols-5">
        <button
          type="button"
          class="rounded bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600"
          [disabled]="selectedCount() !== 1"
          (click)="rename.emit(form.controls.newName.value)"
        >
          Rename
        </button>

        <button
          type="button"
          class="rounded bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600"
          [disabled]="selectedCount() === 0 || form.controls.destination.invalid"
          (click)="move.emit(getPayload())"
        >
          Move
        </button>

        <button
          type="button"
          class="rounded bg-slate-700 px-3 py-2 text-xs hover:bg-slate-600"
          [disabled]="selectedCount() === 0 || form.controls.destination.invalid"
          (click)="copy.emit(getPayload())"
        >
          Copy
        </button>

        <button
          type="button"
          class="rounded bg-red-700 px-3 py-2 text-xs hover:bg-red-600"
          [disabled]="selectedCount() === 0"
          (click)="delete.emit()"
        >
          Delete
        </button>

        <button
          type="button"
          class="rounded bg-emerald-700 px-3 py-2 text-xs hover:bg-emerald-600"
          [disabled]="selectedCount() === 0"
          (click)="restore.emit()"
        >
          Restore
        </button>
      </div>
    </section>
  `,
})
export class OperationsPanelComponent {
  readonly selectedCount = input(0);

  readonly refresh = output<void>();
  readonly rename = output<string>();
  readonly move = output<OperationPayload>();
  readonly copy = output<OperationPayload>();
  readonly delete = output<void>();
  readonly restore = output<void>();

  private readonly fb = new FormBuilder();

  readonly form = this.fb.nonNullable.group({
    destination: ['', Validators.required],
    conflictPolicy: this.fb.nonNullable.control<ConflictPolicy>('rename'),
    newName: '',
  });

  getPayload(): OperationPayload {
    const value = this.form.getRawValue();
    return {
      destination: value.destination.trim(),
      conflictPolicy: value.conflictPolicy,
    };
  }
}
