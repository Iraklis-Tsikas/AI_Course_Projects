import { Injectable, signal } from '@angular/core';

const SESSION_KEY = 'it-intro-seen';

function shouldPlay(): boolean {
  try {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return false;
    return sessionStorage.getItem(SESSION_KEY) !== '1';
  } catch {
    return true;
  }
}

/** Coordinates the boot sequence so the hero animates in right after it. */
@Injectable({ providedIn: 'root' })
export class IntroService {
  readonly playing = signal(shouldPlay());
  readonly done = signal(!this.playing());

  finish(): void {
    if (this.done()) return;
    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      /* ignore */
    }
    this.done.set(true);
  }
}
