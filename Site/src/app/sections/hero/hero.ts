import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ClockService } from '../../core/clock';
import { PROFILE } from '../../core/content';
import { IntroService } from '../../core/intro';
import { NavigationService } from '../../core/navigation';
import { Magnetic, Spotlight } from '../../shared/pointer-fx';

@Component({
  selector: 'app-hero',
  imports: [Magnetic],
  hostDirectives: [Spotlight],
  templateUrl: './hero.html',
  styleUrl: './hero.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { id: 'top', class: 'hero', '[class.is-ready]': 'intro.done()' },
})
export class Hero {
  protected readonly intro = inject(IntroService);
  protected readonly clock = inject(ClockService);
  protected readonly nav = inject(NavigationService);
  protected readonly profile = PROFILE;
  protected readonly firstChars = PROFILE.first.toUpperCase().split('');
  protected readonly since = PROFILE.softwareSince.slice(0, 4);
  protected readonly year = new Date().getFullYear();
}
