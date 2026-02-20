import { ChangeDetectionStrategy, Component, ElementRef, effect, input, output, signal, viewChild } from '@angular/core';

@Component({
  selector: 'app-input-modal',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'onEscape()',
  },
  template: `
    @if (open()) {
      <div
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
          (click)="cancel.emit()"
        ></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-md rounded-2xl border border-white/10 bg-zinc-900 p-6 shadow-2xl"
          (click)="$event.stopPropagation()"
        >
          <h2 [id]="titleId" class="mb-4 text-base font-semibold text-white">
            {{ title() }}
          </h2>

          @if (label()) {
            <label [for]="inputId" class="mb-1.5 block text-sm font-medium text-zinc-300">
              {{ label() }}
            </label>
          }

          <input
            #inputEl
            type="text"
            [id]="inputId"
            [value]="inputValue()"
            [placeholder]="placeholder() ?? ''"
            class="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-200 placeholder-zinc-500 transition-colors focus:border-violet-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-violet-500/50"
            (input)="onInput($event)"
            (keydown.enter)="onConfirm()"
          />

          <div class="mt-5 flex justify-end gap-2">
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
              (click)="cancel.emit()"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="rounded-lg px-4 py-2 text-sm font-medium transition-all"
              [class]="isDanger()
                ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30 hover:text-red-300'
                : 'bg-violet-500/20 text-violet-400 hover:bg-violet-500/30 hover:text-violet-300'"
              (click)="onConfirm()"
            >
              {{ confirmLabel() ?? 'Confirmar' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
})
export class InputModalComponent {
  readonly open = input(false);
  readonly title = input('');
  readonly label = input<string | undefined>(undefined);
  readonly placeholder = input<string | undefined>(undefined);
  readonly initialValue = input('');
  readonly confirmLabel = input<string | undefined>(undefined);
  readonly isDanger = input(false);

  readonly confirm = output<string>();
  readonly cancel = output<void>();

  /** Stable unique IDs for accessibility. */
  readonly titleId = `modal-title-${Math.random().toString(36).slice(2)}`;
  readonly inputId = `modal-input-${Math.random().toString(36).slice(2)}`;

  readonly inputValue = signal('');

  private readonly inputElRef = viewChild<ElementRef<HTMLInputElement>>('inputEl');

  constructor() {
    effect(() => {
      if (this.open()) {
        this.inputValue.set(this.initialValue());
        // Wait one microtask so the DOM is rendered before trying to focus
        queueMicrotask(() => {
          const el = this.inputElRef()?.nativeElement;
          if (el) {
            el.focus();
            el.select();
          }
        });
      }
    });
  }

  onInput(event: Event): void {
    this.inputValue.set((event.target as HTMLInputElement).value);
  }

  onConfirm(): void {
    const value = this.inputValue().trim();
    if (!value) {
      return;
    }
    this.confirm.emit(value);
  }

  onEscape(): void {
    if (this.open()) {
      this.cancel.emit();
    }
  }
}
