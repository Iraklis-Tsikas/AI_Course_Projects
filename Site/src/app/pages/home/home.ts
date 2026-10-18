import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
} from '@angular/core';
import { NavigationService } from '../../core/navigation';
import { About } from '../../sections/about/about';
import { Contact } from '../../sections/contact/contact';
import { Hero } from '../../sections/hero/hero';
import { Journey } from '../../sections/journey/journey';
import { Tape } from '../../sections/tape/tape';
import { Toolbox } from '../../sections/toolbox/toolbox';
import { Work } from '../../sections/work/work';

@Component({
  selector: 'app-home',
  imports: [Hero, Tape, About, Journey, Toolbox, Work, Contact],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-hero />
    <app-tape />
    <app-about />
    <app-journey />
    <app-toolbox />
    <app-work />
    <app-contact />
  `,
})
export class Home {
  constructor() {
    const nav = inject(NavigationService);
    const destroyRef = inject(DestroyRef);

    // Deep links like /#journey are handled by the router's anchorScrolling.
    afterNextRender(() => destroyRef.onDestroy(nav.observeSections()));
  }
}
