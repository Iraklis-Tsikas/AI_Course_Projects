import { DOCUMENT, Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { NAV, PROFILE } from './content';
import { ToastService } from './toast';

@Injectable({ providedIn: 'root' })
export class NavigationService {
  private readonly doc = inject(DOCUMENT);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private observer?: IntersectionObserver;

  /** Id of the section currently in view. */
  readonly active = signal<string>('top');

  /** Smooth-scroll to a section on the home page (navigating there first if needed). */
  async go(id: string, event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.router.url.split('#')[0] !== '/') {
      await this.router.navigateByUrl('/');
      await new Promise((r) => requestAnimationFrame(() => r(null)));
    }
    const target = id === 'top' ? this.doc.body : this.doc.getElementById(id);
    if (!target) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (id === 'top') {
      scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    } else {
      target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    }
    history.replaceState(null, '', id === 'top' ? '/' : `/#${id}`);
  }

  /** Watch the home page sections and keep `active` in sync. */
  observeSections(): () => void {
    this.observer?.disconnect();
    const ids = ['top', ...NAV.map((n) => n.id)];
    const visible = new Map<string, number>();
    this.observer = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.intersectionRatio);
        let best = this.active();
        let max = 0;
        for (const id of ids) {
          const ratio = visible.get(id) ?? 0;
          if (ratio > max) {
            max = ratio;
            best = id;
          }
        }
        if (max > 0) this.active.set(best);
      },
      { rootMargin: '-35% 0px -55% 0px', threshold: [0, 0.01, 0.25, 0.5, 1] },
    );
    for (const id of ids) {
      const el = this.doc.getElementById(id);
      if (el) this.observer.observe(el);
    }
    return () => this.observer?.disconnect();
  }

  async copyEmail(): Promise<void> {
    try {
      await navigator.clipboard.writeText(PROFILE.email);
      this.toast.show('Email copied to clipboard');
    } catch {
      this.toast.show(PROFILE.email, 4000);
    }
  }
}
