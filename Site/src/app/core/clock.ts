import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { PROFILE } from './content';

@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly now = signal(new Date());
  private readonly formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: PROFILE.timezone,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  private readonly offsetFormatter = new Intl.DateTimeFormat('en-US', {
    timeZone: PROFILE.timezone,
    timeZoneName: 'shortOffset',
  });

  readonly time = computed(() => this.formatter.format(this.now()));
  /** e.g. "GMT+3" — accounts for daylight saving automatically. */
  readonly offset = computed(
    () =>
      this.offsetFormatter.formatToParts(this.now()).find((p) => p.type === 'timeZoneName')
        ?.value ?? '',
  );
  readonly shortTime = computed(() => this.time().slice(0, 5));

  constructor() {
    const id = setInterval(() => this.now.set(new Date()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }
}
