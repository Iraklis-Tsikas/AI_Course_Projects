import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { IntroService } from '../../core/intro';

const LINES = [
  'boot  iraklis.tsikas --profile=engineer',
  'load  career.log ............... 12 roles',
  'link  education ................ 2 degrees',
  'build portfolio ................ ok',
];

/** A short terminal-style boot sequence, shown once per session. */
@Component({
  selector: 'app-intro',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'skip()' },
  template: `
    @if (visible()) {
      <div class="intro" [class.is-leaving]="leaving()" (click)="skip()" aria-hidden="true">
        <div class="intro__inner">
          <div class="intro__lines">
            @for (line of lines.slice(0, step()); track $index) {
              <div class="intro__line"><span class="intro__caret">›</span>{{ line }}</div>
            }
          </div>
          <div class="intro__bottom">
            <span class="intro__name">Iraklis Tsikas<span class="intro__dot">.</span></span>
            <span class="intro__count">{{ count() }}<small>%</small></span>
          </div>
        </div>
        <div class="intro__bar" [style.transform]="'scaleX(' + count() / 100 + ')'"></div>
      </div>
    }
  `,
  styles: `
    .intro {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      background: var(--bg);
      color: var(--fg);
      cursor: pointer;
      transition: clip-path 0.9s var(--ease-in-out);
      clip-path: inset(0 0 0 0);
    }
    .intro.is-leaving {
      clip-path: inset(0 0 100% 0);
    }
    .intro__inner {
      flex: 1;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      padding: clamp(24px, 5vw, 56px) var(--gutter);
    }
    .intro__lines {
      font-family: var(--font-mono);
      font-size: clamp(11px, 1.1vw, 13px);
      color: var(--fg-muted);
      display: grid;
      gap: 6px;
    }
    .intro__line {
      white-space: pre;
      animation: line-in 0.3s var(--ease-out);
    }
    .intro__caret {
      color: var(--accent-text);
      margin-right: 10px;
    }
    .intro__bottom {
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 24px;
    }
    .intro__name {
      font-size: clamp(1.4rem, 3vw, 2.4rem);
      font-weight: 700;
      letter-spacing: -0.04em;
    }
    .intro__dot {
      color: var(--accent);
    }
    .intro__count {
      font-size: clamp(5rem, 16vw, 14rem);
      font-weight: 800;
      line-height: 0.8;
      letter-spacing: -0.06em;
      font-variant-numeric: tabular-nums;
    }
    .intro__count small {
      font-size: 0.3em;
      color: var(--accent);
      margin-left: 0.05em;
    }
    .intro__bar {
      height: 3px;
      background: var(--accent);
      transform-origin: left;
    }
    @keyframes line-in {
      from {
        opacity: 0;
        transform: translateX(-8px);
      }
    }
  `,
})
export class Intro {
  private readonly intro = inject(IntroService);
  protected readonly lines = LINES;
  protected readonly visible = signal(this.intro.playing());
  protected readonly leaving = signal(false);
  protected readonly count = signal(0);
  protected readonly step = signal(0);

  private frame = 0;
  private timers: ReturnType<typeof setTimeout>[] = [];

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!this.visible()) return;
      document.documentElement.style.overflow = 'hidden';
      const duration = 1500;
      const start = performance.now();
      const tick = (now: number) => {
        const p = Math.min(1, (now - start) / duration);
        const eased = 1 - Math.pow(1 - p, 3);
        this.count.set(Math.round(eased * 100));
        this.step.set(Math.min(LINES.length, Math.floor(p * (LINES.length + 0.6)) + 1));
        if (p < 1) this.frame = requestAnimationFrame(tick);
        else this.timers.push(setTimeout(() => this.skip(), 180));
      };
      this.frame = requestAnimationFrame(tick);
    });
    destroyRef.onDestroy(() => {
      cancelAnimationFrame(this.frame);
      this.timers.forEach(clearTimeout);
    });
  }

  protected skip(): void {
    if (!this.visible() || this.leaving()) return;
    cancelAnimationFrame(this.frame);
    this.count.set(100);
    this.step.set(LINES.length);
    this.leaving.set(true);
    document.documentElement.style.overflow = '';
    this.intro.finish();
    this.timers.push(setTimeout(() => this.visible.set(false), 950));
  }
}
