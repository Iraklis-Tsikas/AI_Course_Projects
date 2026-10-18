import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CERTIFICATIONS, EDUCATION, PROFILE, ROLES } from '../../core/content';
import { monthsBetween } from '../../core/dates';
import { CountUp } from '../../shared/count-up';
import { Tilt } from '../../shared/pointer-fx';
import { Reveal } from '../../shared/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

@Component({
  selector: 'app-about',
  imports: [SectionHead, Reveal, CountUp, Tilt],
  templateUrl: './about.html',
  styleUrl: './about.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class About {
  protected readonly profile = PROFILE;
  protected readonly since = PROFILE.softwareSince.slice(0, 4);

  protected readonly stats = [
    {
      value: Math.floor(monthsBetween(PROFILE.softwareSince, null) / 12),
      plus: true,
      label: 'Years shipping production software',
    },
    { value: EDUCATION.length, plus: false, label: "Master's-level degrees" },
    { value: ROLES.length, plus: false, label: 'Roles across seven industries' },
    { value: CERTIFICATIONS.courses.length + 1, plus: false, label: 'Python certifications' },
  ];
}
