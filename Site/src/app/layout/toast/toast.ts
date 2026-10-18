import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/toast';

@Component({
  selector: 'app-toast',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toast" [class.is-on]="toast.message()" role="status" aria-live="polite">
      @if (toast.message(); as message) {
        <span class="toast__mark" aria-hidden="true">✓</span>{{ message }}
      }
    </div>
  `,
  styles: `
    .toast {
      position: fixed;
      left: 50%;
      bottom: 28px;
      z-index: 200;
      display: inline-flex;
      align-items: center;
      gap: 12px;
      padding: 14px 20px;
      background: var(--fg);
      color: var(--bg);
      font-family: var(--font-mono);
      font-size: 12px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      transform: translate(-50%, calc(100% + 48px));
      visibility: hidden;
      transition:
        transform 0.6s var(--ease-out),
        visibility 0s linear 0.6s;
      pointer-events: none;
    }
    .toast.is-on {
      transform: translate(-50%, 0);
      visibility: visible;
      transition: transform 0.6s var(--ease-out);
    }
    .toast__mark {
      display: grid;
      place-items: center;
      width: 20px;
      height: 20px;
      background: var(--accent);
      color: var(--accent-ink);
    }
  `,
})
export class Toast {
  protected readonly toast = inject(ToastService);
}
