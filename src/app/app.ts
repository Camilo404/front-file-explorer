import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AlertStackComponent } from './shared/components/alert-stack.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, AlertStackComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {}
