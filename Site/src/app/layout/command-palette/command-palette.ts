import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { NAV, PROFILE } from '../../core/content';
import { NavigationService } from '../../core/navigation';
import { PaletteService } from '../../core/palette';
import { ThemeService } from '../../core/theme';

interface Command {
  id: string;
  label: string;
  group: 'Navigate' | 'Actions' | 'Elsewhere';
  hint: string;
  glyph: string;
  keywords?: string;
  run: () => void;
}

@Component({
  selector: 'app-command-palette',
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(document:keydown)': 'onGlobalKey($event)' },
})
export class CommandPalette {
  protected readonly palette = inject(PaletteService);
  private readonly nav = inject(NavigationService);
  private readonly theme = inject(ThemeService);

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('input');

  protected readonly query = signal('');
  protected readonly cursor = signal(0);

  private readonly commands: Command[] = [
    {
      id: 'top',
      label: 'Home',
      group: 'Navigate',
      hint: 'Back to the top',
      glyph: '↑',
      run: () => this.nav.go('top'),
    },
    ...NAV.map<Command>((n) => ({
      id: n.id,
      label: n.label,
      group: 'Navigate',
      hint: `Section ${n.index}`,
      glyph: n.index,
      run: () => this.nav.go(n.id),
    })),
    {
      id: 'copy-email',
      label: 'Copy email address',
      group: 'Actions',
      hint: PROFILE.email,
      glyph: '⧉',
      keywords: 'contact mail clipboard',
      run: () => this.nav.copyEmail(),
    },
    {
      id: 'send-email',
      label: 'Write an email',
      group: 'Actions',
      hint: 'Opens your mail client',
      glyph: '✉',
      keywords: 'contact mail',
      run: () => (location.href = `mailto:${PROFILE.email}`),
    },
    {
      id: 'theme',
      label: 'Toggle light / dark theme',
      group: 'Actions',
      hint: 'Appearance',
      glyph: '◐',
      keywords: 'dark light mode appearance',
      run: () => this.theme.toggle(),
    },
    {
      id: 'linkedin',
      label: 'Open LinkedIn',
      group: 'Elsewhere',
      hint: 'linkedin.com',
      glyph: '↗',
      keywords: 'profile social',
      run: () => open(PROFILE.links.linkedin, '_blank', 'noopener'),
    },
    {
      id: 'github',
      label: 'Open GitHub',
      group: 'Elsewhere',
      hint: 'github.com/Averelakos',
      glyph: '↗',
      keywords: 'code repos portfolio',
      run: () => open(PROFILE.links.github, '_blank', 'noopener'),
    },
    {
      id: 'cv',
      label: 'Download résumé',
      group: 'Elsewhere',
      hint: 'PDF',
      glyph: '⤓',
      keywords: 'cv resume pdf download',
      run: () => open(PROFILE.cv, '_blank', 'noopener'),
    },
  ];

  protected readonly filtered = computed(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return this.commands;
    return this.commands.filter((c) =>
      `${c.label} ${c.group} ${c.hint} ${c.keywords ?? ''}`.toLowerCase().includes(q),
    );
  });

  protected readonly groups = computed(() => {
    const out: { name: string; items: Command[] }[] = [];
    for (const cmd of this.filtered()) {
      let g = out.find((x) => x.name === cmd.group);
      if (!g) out.push((g = { name: cmd.group, items: [] }));
      g.items.push(cmd);
    }
    return out;
  });

  protected readonly active = computed(() => this.filtered()[this.cursor()] ?? null);

  constructor() {
    effect(() => {
      const dialog = this.dialog().nativeElement;
      if (this.palette.isOpen()) {
        if (!dialog.open) {
          this.query.set('');
          this.cursor.set(0);
          dialog.showModal();
          this.input().nativeElement.focus();
        }
      } else if (dialog.open) {
        dialog.close();
      }
    });
  }

  protected onGlobalKey(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.palette.toggle();
    }
  }

  protected onInput(value: string): void {
    this.query.set(value);
    this.cursor.set(0);
  }

  protected onKey(e: KeyboardEvent): void {
    const count = this.filtered().length;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      this.cursor.update((c) => (count ? (c + 1) % count : 0));
      this.scrollActiveIntoView();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      this.cursor.update((c) => (count ? (c - 1 + count) % count : 0));
      this.scrollActiveIntoView();
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const cmd = this.active();
      if (cmd) this.run(cmd);
    }
  }

  protected hover(cmd: Command): void {
    const i = this.filtered().indexOf(cmd);
    if (i !== this.cursor()) this.cursor.set(i);
  }

  protected run(cmd: Command): void {
    // Close synchronously so the browser's focus restoration can't interrupt a smooth scroll.
    this.dialog().nativeElement.close();
    this.palette.close();
    requestAnimationFrame(() => cmd.run());
  }

  protected onBackdrop(e: MouseEvent): void {
    if (e.target === this.dialog().nativeElement) this.palette.close();
  }

  private scrollActiveIntoView(): void {
    requestAnimationFrame(() =>
      this.dialog().nativeElement.querySelector('.is-active')?.scrollIntoView({ block: 'nearest' }),
    );
  }
}
