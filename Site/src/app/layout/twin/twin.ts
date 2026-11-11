import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  ViewEncapsulation,
  afterNextRender,
  afterRenderEffect,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { PROFILE, TWIN } from '../../core/content';
import { TwinService } from '../../core/twin';
import { renderMarkdown } from '../../shared/markdown';

@Component({
  selector: 'app-twin',
  templateUrl: './twin.html',
  styleUrl: './twin.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // Replies are rendered via [innerHTML], so styles must reach that markup; every class is
  // prefixed with `twin-` to keep them contained.
  encapsulation: ViewEncapsulation.None,
  host: { '(document:keydown.escape)': 'onEscape()' },
})
export class Twin {
  protected readonly twin = inject(TwinService);
  protected readonly profile = PROFILE;
  protected readonly greeting = TWIN.greeting;
  protected readonly suggestions = TWIN.suggestions;
  protected readonly draft = signal('');
  /** The hero has its own "Ask my AI twin" button, so the floating launcher waits until it scrolls away. */
  protected readonly overHero = signal(true);
  protected readonly announcement = signal('');

  private readonly input = viewChild<ElementRef<HTMLTextAreaElement>>('input');
  private readonly scroller = viewChild<ElementRef<HTMLElement>>('scroller');
  private stickToBottom = true;
  private wasOpen = false;
  private lastSettled = 0;

  protected readonly status = computed(() => {
    if (this.twin.busy()) return { tone: 'busy', text: 'Typing…' };
    switch (this.twin.availability()) {
      case 'online':
        return { tone: 'online', text: 'Online · answers from my career data' };
      case 'unconfigured':
        return { tone: 'offline', text: 'Offline · AI key not configured' };
      case 'unreachable':
        return { tone: 'offline', text: "Offline · can't reach the server" };
      default:
        return { tone: 'unknown', text: 'Connecting…' };
    }
  });

  protected readonly modelLabel = computed(() => {
    const model = this.twin.model();
    if (!model) return 'Gemini';
    return model
      .replace(/^gemini/i, 'Gemini')
      .replace(/-(\d)/, ' $1')
      .replace(/-/g, ' ')
      .replace(/\b(flash|pro|lite)\b/gi, (w) => w[0].toUpperCase() + w.slice(1));
  });

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      let frame = 0;
      const update = () => {
        const hero = document.querySelector('app-hero');
        const over = !!hero && hero.getBoundingClientRect().bottom > innerHeight * 0.35;
        if (over !== this.overHero()) this.overHero.set(over);
      };
      const onScroll = () => {
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(update);
      };
      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      // Route changes swap the hero in or out without a scroll.
      const observer = new MutationObserver(onScroll);
      observer.observe(document.querySelector('main') ?? document.body, { childList: true });
      update();
      destroyRef.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
        observer.disconnect();
        cancelAnimationFrame(frame);
      });
    });

    afterRenderEffect(() => {
      const open = this.twin.isOpen();
      const messages = this.twin.messages();
      const scroller = this.scroller()?.nativeElement;

      if (open && !this.wasOpen) {
        this.input()?.nativeElement.focus({ preventScroll: true });
        this.stickToBottom = true;
      }
      this.wasOpen = open;

      if (scroller && this.stickToBottom) scroller.scrollTop = scroller.scrollHeight;

      // Announce finished replies to screen readers (not every streamed character).
      const settled = messages.filter((m) => m.role === 'model' && !m.streaming);
      const latest = settled.at(-1);
      if (latest && latest.id !== this.lastSettled) {
        this.lastSettled = latest.id;
        this.announcement.set(latest.error ?? latest.text);
      }
    });
  }

  protected render(text: string, streaming = false): string {
    return renderMarkdown(text, { cursor: streaming });
  }

  protected onScroll(el: HTMLElement): void {
    this.stickToBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 48;
  }

  protected onInput(el: HTMLTextAreaElement): void {
    this.draft.set(el.value);
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
  }

  protected onKey(e: KeyboardEvent): void {
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      e.preventDefault();
      this.submit();
    }
  }

  protected submit(e?: Event): void {
    e?.preventDefault();
    const text = this.draft().trim();
    if (!text || this.twin.busy()) return;
    this.stickToBottom = true;
    void this.twin.send(text);
    this.draft.set('');
    const el = this.input()?.nativeElement;
    if (el) {
      el.value = '';
      el.style.height = 'auto';
    }
  }

  protected ask(question: string): void {
    this.stickToBottom = true;
    void this.twin.send(question);
    this.input()?.nativeElement.focus({ preventScroll: true });
  }

  protected onEscape(): void {
    if (this.twin.isOpen() && !document.querySelector('dialog[open]')) this.twin.close();
  }
}
