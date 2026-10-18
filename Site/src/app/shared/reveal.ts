import { DestroyRef, Directive, ElementRef, afterNextRender, inject, input } from '@angular/core';

/**
 * Fades/slides an element in the first time it scrolls into view.
 * Usage: <div appReveal [revealDelay]="120"> or appReveal="line" for a masked line reveal.
 */
@Directive({
  selector: '[appReveal]',
  host: {
    '[class.reveal]': 'appReveal() !== "line"',
    '[class.reveal-line]': 'appReveal() === "line"',
    '[style.--reveal-delay.ms]': 'revealDelay()',
  },
})
export class Reveal {
  readonly appReveal = input<'' | 'line'>('');
  readonly revealDelay = input(0);

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);

    afterNextRender(() => {
      const io = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              el.classList.add('is-in');
              io.disconnect();
            }
          }
        },
        { rootMargin: '0px 0px -8% 0px', threshold: 0.01 },
      );
      io.observe(el);
      destroyRef.onDestroy(() => io.disconnect());
    });
  }
}
