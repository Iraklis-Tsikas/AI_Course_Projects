import { DOCUMENT, Injectable, effect, inject, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

const STORAGE_KEY = 'it-theme';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  readonly theme = signal<Theme>(
    this.doc.documentElement.dataset['theme'] === 'light' ? 'light' : 'dark',
  );

  constructor() {
    effect(() => {
      const theme = this.theme();
      const root = this.doc.documentElement;
      root.dataset['theme'] = theme;
      this.doc
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', theme === 'light' ? '#f1efe9' : '#0a0a0b');
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        /* storage unavailable — theme still applies for this visit */
      }
    });
  }

  toggle(): void {
    this.theme.update((t) => (t === 'dark' ? 'light' : 'dark'));
  }
}
