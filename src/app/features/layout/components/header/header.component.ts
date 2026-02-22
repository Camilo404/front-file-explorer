import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-header',
  standalone: true,
  template: `
    <header class="md:hidden flex items-center justify-between px-4 h-16 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md shrink-0 z-30">
      <div class="flex items-center gap-2.5">
        <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-lg shadow-violet-500/30">
          <i class="fa-solid fa-folder-open text-sm"></i>
        </div>
        <span class="text-lg font-semibold tracking-tight text-white">FileExplorer</span>
      </div>
      
      <button
        type="button"
        class="flex flex-col items-center justify-center gap-1.25 w-10 h-10 rounded-xl text-zinc-300 hover:text-white hover:bg-white/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500"
        aria-label="Toggle menu"
        [attr.aria-expanded]="menuOpen()"
        (click)="toggle.emit()"
      >
        <span class="bar" [class.bar-top-open]="menuOpen()"></span>
        <span class="bar" [class.bar-mid-open]="menuOpen()"></span>
        <span class="bar" [class.bar-bot-open]="menuOpen()"></span>
      </button>
    </header>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .bar {
      display: block;
      width: 22px;
      height: 2px;
      background: currentColor;
      border-radius: 2px;
      transition: transform 0.3s ease, opacity 0.2s ease;
      transform-origin: center;
    }
    .bar-top-open    { transform: translateY(6px) rotate(45deg); }
    .bar-mid-open    { opacity: 0; transform: scaleX(0); }
    .bar-bot-open    { transform: translateY(-6px) rotate(-45deg); }
  `
})
export class HeaderComponent {
  readonly menuOpen = input.required<boolean>();
  readonly toggle = output<void>();
}
