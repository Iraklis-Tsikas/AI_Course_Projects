import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommandPalette } from './layout/command-palette/command-palette';
import { Footer } from './layout/footer/footer';
import { Intro } from './layout/intro/intro';
import { Nav } from './layout/nav/nav';
import { Toast } from './layout/toast/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, Nav, Footer, Intro, CommandPalette, Toast],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main">Skip to content</a>
    <app-intro />
    <app-nav />
    <main id="main" tabindex="-1">
      <router-outlet />
    </main>
    <app-footer />
    <app-command-palette />
    <app-toast />
  `,
  styles: `
    main {
      display: block;
      outline: none;
    }
  `,
})
export class App {}
