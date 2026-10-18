import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/** Counts a number up from zero when it scrolls into view. */
@Directive({ selector: '[appCountUp]' })
export class CountUp {
  readonly appCountUp = input.required<number>();
  readonly pad = input(2);
  readonly suffix = input('');

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    let frame = 0;

    afterNextRender(() => {
      const target = this.appCountUp();
      const fmt = (n: number) => String(n).padStart(this.pad(), '0') + this.suffix();
      el.textContent = fmt(target);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      el.textContent = fmt(0);

      const io = new IntersectionObserver(
        (entries) => {
          if (!entries.some((e) => e.isIntersecting)) return;
          io.disconnect();
          const start = performance.now();
          const duration = 1400;
          const tick = (now: number) => {
            const p = Math.min(1, (now - start) / duration);
            const eased = 1 - Math.pow(1 - p, 4);
            el.textContent = fmt(Math.round(target * eased));
            if (p < 1) frame = requestAnimationFrame(tick);
          };
          frame = requestAnimationFrame(tick);
        },
        { threshold: 0.5 },
      );
      io.observe(el);
      destroyRef.onDestroy(() => {
        io.disconnect();
        cancelAnimationFrame(frame);
      });
    });
  }
}
