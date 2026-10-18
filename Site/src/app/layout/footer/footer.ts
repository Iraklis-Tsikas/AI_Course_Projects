import { ChangeDetectionStrategy, Component, VERSION, inject } from '@angular/core';
import { ClockService } from '../../core/clock';
import { NAV, PROFILE } from '../../core/content';
import { NavigationService } from '../../core/navigation';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.html',
  styleUrl: './footer.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Footer {
  protected readonly nav = inject(NavigationService);
  protected readonly clock = inject(ClockService);
  protected readonly profile = PROFILE;
  protected readonly items = NAV;
  protected readonly year = new Date().getFullYear();
  protected readonly ngVersion = VERSION.major;
}
