import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { PROFILE } from '../../core/content';
import { NavigationService } from '../../core/navigation';
import { Magnetic } from '../../shared/pointer-fx';
import { Reveal } from '../../shared/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

@Component({
  selector: 'app-contact',
  imports: [SectionHead, Reveal, Magnetic],
  templateUrl: './contact.html',
  styleUrl: './contact.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Contact {
  protected readonly nav = inject(NavigationService);
  protected readonly profile = PROFILE;

  protected readonly channels = [
    { name: 'Email', value: PROFILE.email, href: `mailto:${PROFILE.email}`, external: false },
    {
      name: 'LinkedIn',
      value: PROFILE.links.linkedin.replace(/^https?:\/\/(www\.)?/, ''),
      href: PROFILE.links.linkedin,
      external: true,
    },
    {
      name: 'GitHub',
      value: PROFILE.links.github.replace(/^https?:\/\/(www\.)?/, ''),
      href: PROFILE.links.github,
      external: true,
    },
    { name: 'Résumé', value: 'Download PDF', href: PROFILE.cv, external: true, download: true },
  ];
}
