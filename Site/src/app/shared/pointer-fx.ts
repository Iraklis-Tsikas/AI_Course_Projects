import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
  numberAttribute,
} from '@angular/core';

const finePointer = () => matchMedia('(hover: hover) and (pointer: fine)').matches;
const reducedMotion = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Writes the pointer position into --mx / --my so CSS can paint a spotlight.
 * Listeners are attached outside Angular templates so they never trigger change detection.
 */
@Directive({ selector: '[appSpotlight]', host: { class: 'spotlight' } })
export class Spotlight {
  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!finePointer()) return;
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      };
      el.addEventListener('pointermove', move, { passive: true });
      destroyRef.onDestroy(() => el.removeEventListener('pointermove', move));
    });
  }
}

/** Gentle 3D tilt toward the pointer. Exposes --rx / --ry / --px / --py. */
@Directive({ selector: '[appTilt]' })
export class Tilt {
  readonly appTilt = input(10, { transform: (v: unknown) => numberAttribute(v, 10) });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!finePointer() || reducedMotion()) return;
      let frame = 0;
      const move = (e: PointerEvent) => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const r = el.getBoundingClientRect();
          const px = (e.clientX - r.left) / r.width;
          const py = (e.clientY - r.top) / r.height;
          const max = this.appTilt();
          el.style.setProperty('--ry', `${(px - 0.5) * max}deg`);
          el.style.setProperty('--rx', `${(0.5 - py) * max}deg`);
          el.style.setProperty('--px', `${px * 100}%`);
          el.style.setProperty('--py', `${py * 100}%`);
        });
      };
      const leave = () => {
        cancelAnimationFrame(frame);
        el.style.setProperty('--rx', '0deg');
        el.style.setProperty('--ry', '0deg');
      };
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerleave', leave);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(frame);
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      });
    });
  }
}

/** Pulls an element a few pixels toward the pointer — used on primary CTAs. */
@Directive({ selector: '[appMagnetic]' })
export class Magnetic {
  readonly appMagnetic = input(0.25, { transform: (v: unknown) => numberAttribute(v, 0.25) });

  constructor() {
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      if (!finePointer() || reducedMotion()) return;
      el.style.transition =
        'transform 0.6s cubic-bezier(0.16, 1, 0.3, 1), color 0.45s, border-color 0.45s';
      const move = (e: PointerEvent) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * this.appMagnetic();
        const y = (e.clientY - (r.top + r.height / 2)) * this.appMagnetic();
        el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      };
      const leave = () => (el.style.transform = '');
      el.addEventListener('pointermove', move, { passive: true });
      el.addEventListener('pointerleave', leave);
      destroyRef.onDestroy(() => {
        el.removeEventListener('pointermove', move);
        el.removeEventListener('pointerleave', leave);
      });
    });
  }
}
