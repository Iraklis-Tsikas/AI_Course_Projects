import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="nf container">
      <span class="mono nf__code"><span class="accent">ERR</span> 404 · route_not_found</span>
      <h1 class="nf__title">Lost<span class="accent">.</span></h1>
      <p class="lede nf__copy">
        This page took the long way round too — and didn't make it. Let's get you back on track.
      </p>
      <a class="btn btn--primary" routerLink="/">Back to home <span class="btn__arrow">→</span></a>
    </section>
  `,
  styles: `
    .nf {
      min-height: 100svh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: flex-start;
      gap: 24px;
      padding-top: var(--nav-h);
    }
    .nf__code {
      color: var(--fg-muted);
    }
    .nf__title {
      font-size: clamp(6rem, 22vw, 20rem);
      font-weight: 800;
      line-height: 0.8;
      letter-spacing: -0.07em;
    }
    .nf__copy {
      max-width: 40ch;
      margin-bottom: 16px;
    }
  `,
})
export class NotFound {}
