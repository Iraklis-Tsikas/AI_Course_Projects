import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/core';
import { ClockService } from '../../core/clock';
import { NAV, PROFILE } from '../../core/content';
import { NavigationService } from '../../core/navigation';
import { PaletteService } from '../../core/palette';
import { ThemeService } from '../../core/theme';

@Component({
  selector: 'app-nav',
  templateUrl: './nav.html',
  styleUrl: './nav.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(document:keydown.escape)': 'menuOpen.set(false)',
  },
})
export class Nav {
  protected readonly nav = inject(NavigationService);
  protected readonly clock = inject(ClockService);
  protected readonly theme = inject(ThemeService);
  protected readonly palette = inject(PaletteService);
  protected readonly items = NAV;
  protected readonly profile = PROFILE;
  protected readonly isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

  protected readonly scrolled = signal(false);
  protected readonly hidden = signal(false);
  protected readonly menuOpen = signal(false);

  private readonly progress = viewChild.required<ElementRef<HTMLElement>>('progress');

  constructor() {
    const doc = inject(DOCUMENT);
    const destroyRef = inject(DestroyRef);

    effect(() => {
      doc.documentElement.style.overflow = this.menuOpen() ? 'hidden' : '';
    });

    afterNextRender(() => {
      let lastY = scrollY;
      let frame = 0;
      const update = () => {
        const y = scrollY;
        const max = doc.documentElement.scrollHeight - innerHeight;
        this.progress().nativeElement.style.transform = `scaleX(${max > 0 ? y / max : 0})`;
        const scrolled = y > 24;
        if (scrolled !== this.scrolled()) this.scrolled.set(scrolled);
        const delta = y - lastY;
        if (Math.abs(delta) > 6) {
          const hide = delta > 0 && y > innerHeight * 0.6 && !this.menuOpen();
          if (hide !== this.hidden()) this.hidden.set(hide);
          lastY = y;
        }
      };
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      update();
      destroyRef.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
        cancelAnimationFrame(frame);
      });
    });
  }

  protected goMobile(id: string, event: Event): void {
    this.menuOpen.set(false);
    void this.nav.go(id, event);
  }
}
