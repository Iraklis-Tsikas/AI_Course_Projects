import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

const GLYPHS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#%&*+/<>_';

/**
 * Decodes text from random glyphs when it enters the viewport — a terminal-style flourish.
 * The final text is always available to assistive tech via aria-label.
 */
@Directive({
  selector: '[appScramble]',
  host: { '[attr.aria-label]': 'appScramble()' },
})
export class Scramble {
  readonly appScramble = input.required<string>();
  readonly scrambleDuration = input(900);
  readonly scrambleDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    let frame = 0;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    afterNextRender(() => {
      const text = this.appScramble();
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      el.textContent = text;
      if (reduce) return;

      const run = () => {
        const duration = this.scrambleDuration();
        const start = performance.now();
        const tick = (now: number) => {
          const p = Math.min(1, (now - start) / duration);
          let out = '';
          for (let i = 0; i < text.length; i++) {
            const ch = text[i];
            const settleAt = (i / text.length) * 0.75 + 0.25;
            if (ch === ' ' || p >= settleAt) out += ch;
            else out += GLYPHS[(Math.random() * GLYPHS.length) | 0];
          }
          el.textContent = out;
          if (p < 1) frame = requestAnimationFrame(tick);
        };
        frame = requestAnimationFrame(tick);
      };

      const io = new IntersectionObserver(
        (entries) => {
          if (entries.some((e) => e.isIntersecting)) {
            io.disconnect();
            timeout = setTimeout(run, this.scrambleDelay());
          }
        },
        { threshold: 0.2 },
      );
      io.observe(el);

      destroyRef.onDestroy(() => {
        io.disconnect();
        clearTimeout(timeout);
        cancelAnimationFrame(frame);
      });
    });
  }
}
