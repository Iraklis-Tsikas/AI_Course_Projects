import { ChangeDetectionStrategy, Component } from '@angular/core';

/** Two crossing "caution tape" marquees — the edgy seam between hero and content. */
@Component({
  selector: 'app-tape',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <div class="tape tape--back">
      <div class="tape__track tape__track--rev">
        @for (n of copies; track n) {
          <span class="tape__run">
            @for (w of back; track w) {
              <span>{{ w }}</span
              ><span class="tape__sep">/</span>
            }
          </span>
        }
      </div>
    </div>
    <div class="tape tape--front">
      <div class="tape__track">
        @for (n of copies; track n) {
          <span class="tape__run">
            @for (w of front; track w) {
              <span>{{ w }}</span
              ><span class="tape__sep">✦</span>
            }
          </span>
        }
      </div>
    </div>
  `,
  styles: `
    :host {
      position: relative;
      display: block;
      height: clamp(150px, 16vw, 220px);
      overflow: clip;
      margin-block: clamp(-40px, -2vw, -20px);
    }
    .tape {
      position: absolute;
      left: -5%;
      right: -5%;
      top: 50%;
      overflow: hidden;
      padding-block: clamp(12px, 1.4vw, 18px);
      border-block: 1px solid var(--line-strong);
    }
    .tape--front {
      background: var(--accent);
      color: var(--accent-ink);
      transform: translateY(-50%) rotate(-2.6deg);
      z-index: 1;
      box-shadow: 0 20px 50px -20px rgba(0, 0, 0, 0.5);
    }
    .tape--back {
      background: var(--fg);
      color: var(--bg);
      transform: translateY(-50%) rotate(2.2deg);
    }
    .tape__track {
      display: flex;
      width: max-content;
      animation: marquee 48s linear infinite;
    }
    .tape__track--rev {
      animation-direction: reverse;
      animation-duration: 60s;
    }
    .tape__run {
      display: flex;
      align-items: center;
      gap: clamp(18px, 2vw, 32px);
      padding-right: clamp(18px, 2vw, 32px);
      font-size: clamp(1.2rem, 2.4vw, 2.1rem);
      font-weight: 750;
      letter-spacing: -0.03em;
      text-transform: uppercase;
      white-space: nowrap;
      line-height: 1;
    }
    .tape--back .tape__run {
      font-family: var(--font-mono);
      font-weight: 500;
      font-size: clamp(0.8rem, 1.2vw, 1rem);
      letter-spacing: 0.08em;
    }
    .tape__sep {
      font-weight: 400;
      opacity: 0.7;
    }
    @keyframes marquee {
      to {
        transform: translateX(-50%);
      }
    }
  `,
})
export class Tape {
  protected readonly copies = [0, 1, 2, 3];
  protected readonly front = [
    'C#',
    'TypeScript',
    'Python',
    'Git',
    'SQL',
    'Banking systems',
    'Enterprise software',
    'Data & APIs',
  ];
  protected readonly back = [
    'From hydroponics to banking',
    '12 roles',
    '2 degrees',
    '1 direction',
    'Athens, GR',
    'Est. 2021',
    'Built the long way round',
  ];
}
