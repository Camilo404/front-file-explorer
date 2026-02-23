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
        class="fixed inset-0 z-60 flex items-center justify-center p-4 font-sans"
        role="dialog"
        aria-modal="true"
        [attr.aria-labelledby]="titleId"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-in fade-in"
          aria-hidden="true"
          (click)="cancel.emit()"
        ></div>

        <!-- Panel -->
        <div
          class="relative w-full max-w-md scale-100 overflow-hidden rounded-3xl border border-white/10 bg-zinc-900 shadow-2xl transition-all duration-300 animate-in zoom-in-95 slide-in-from-bottom-2"
          (click)="$event.stopPropagation()"
        >
          <!-- Header -->
          <div class="border-b border-white/5 bg-white/5 p-6">
            <h2 [id]="titleId" class="text-lg font-bold tracking-tight text-white">
              {{ title() }}
            </h2>
          </div>

          <!-- Body -->
          <div class="p-6">
            @if (label()) {
              <label [for]="inputId" class="mb-2 block text-sm font-medium text-zinc-300">
                {{ label() }}
              </label>
            }

            <div class="relative group">
              <input
                #inputEl
                type="text"
                [id]="inputId"
                [value]="inputValue()"
                [placeholder]="placeholder() ?? ''"
                class="block w-full rounded-xl border border-white/10 bg-black/20 py-3 pl-4 pr-4 text-sm text-zinc-200 placeholder-zinc-500 transition-all focus:border-violet-500/50 focus:bg-white/5 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
                [class.border-red-500/50]="isDanger() && inputValue().length > 0"
                [class.focus:border-red-500/50]="isDanger()"
                [class.focus:ring-red-500/20]="isDanger()"
                (input)="onInput($event)"
                (keydown.enter)="onConfirm()"
              />
              @if (inputValue().length > 0) {
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 focus:outline-none"
                  (click)="inputValue.set(''); inputEl.focus()"
                  aria-label="Clear field"
                >
                  <i class="fa-solid fa-circle-xmark"></i>
                </button>
              }
            </div>

            <!-- Actions -->
            <div class="mt-8 flex justify-end gap-3">
              <button
                type="button"
                class="rounded-xl px-4 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-zinc-200 active:scale-95"
                (click)="cancel.emit()"
              >
                Cancel
              </button>
              <button
                type="button"
                class="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                [disabled]="!inputValue().trim()"
                [class]="isDanger()
                  ? 'bg-red-600 hover:bg-red-500 shadow-red-500/20 hover:shadow-red-500/30'
                  : 'bg-violet-600 hover:bg-violet-500 shadow-violet-500/20 hover:shadow-violet-500/30'"
                (click)="onConfirm()"
              >
                <span>{{ confirmLabel() ?? 'Confirm' }}</span>
                @if (inputValue().trim()) {
                  <i class="fa-solid fa-arrow-right text-xs opacity-70"></i>
                }
              </button>
            </div>
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

