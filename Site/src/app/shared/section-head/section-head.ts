import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { Reveal } from '../reveal';
import { Scramble } from '../scramble';

@Component({
  selector: 'app-section-head',
  imports: [Reveal, Scramble],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="sh" appReveal>
      <span class="sh__index mono"
        ><span class="accent">(</span>{{ index() }}<span class="accent">)</span></span
      >
      <span class="sh__rule" aria-hidden="true"></span>
      <span class="sh__label mono" [appScramble]="label()"></span>
    </div>
  `,
  styles: `
    .sh {
      display: flex;
      align-items: center;
      gap: 20px;
      margin-bottom: clamp(40px, 6vw, 80px);
      color: var(--fg-muted);
    }
    .sh__rule {
      flex: 1;
      height: 1px;
      background: var(--line-strong);
      transform-origin: left;
      transform: scaleX(0);
      transition: transform 1.4s var(--ease-out) 0.15s;
    }
    .is-in .sh__rule {
      transform: none;
    }
    .sh__index,
    .sh__label {
      color: var(--fg);
    }
  `,
})
export class SectionHead {
  readonly index = input.required<string>();
  readonly label = input.required<string>();
}
