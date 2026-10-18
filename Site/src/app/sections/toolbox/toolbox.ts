import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { CERTIFICATIONS, PROFILE } from '../../core/content';
import { Spotlight } from '../../shared/pointer-fx';
import { Reveal } from '../../shared/reveal';
import { SectionHead } from '../../shared/section-head/section-head';
import { highlight } from './highlight';

const SNIPPETS = [
  {
    file: 'Engineer.cs',
    lang: 'cs' as const,
    label: 'C#',
    code: `namespace Portfolio;

public sealed record Engineer(string Name, string Base)
{
    public string Role    { get; init; } = "Software Engineer";
    public string Company { get; init; } = "Natech Banking Solutions";
    public string[] Stack { get; init; } = ["C#", "TypeScript", "Python", "Git"];

    public bool ShipsReliableCode() => true;
}

var me = new Engineer("Iraklis Tsikas", "Athens, GR");`,
  },
  {
    file: 'engineer.ts',
    lang: 'ts' as const,
    label: 'TypeScript',
    code: `interface Engineer {
  name: string;
  base: string;
  stack: readonly string[];
  shipping: boolean;
}

export const me = {
  name: 'Iraklis Tsikas',
  base: 'Athens, GR',
  stack: ['C#', 'TypeScript', 'Python', 'Git'],
  shipping: true,
} satisfies Engineer;`,
  },
  {
    file: 'engineer.py',
    lang: 'py' as const,
    label: 'Python',
    code: `from dataclasses import dataclass

@dataclass(frozen=True)
class Engineer:
    name: str = "Iraklis Tsikas"
    base: str = "Athens, GR"
    stack: tuple = ("C#", "TypeScript", "Python", "Git")

    def is_shipping(self) -> bool:
        return True`,
  },
];

@Component({
  selector: 'app-toolbox',
  imports: [SectionHead, Reveal, Spotlight],
  templateUrl: './toolbox.html',
  styleUrl: './toolbox.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Toolbox {
  protected readonly profile = PROFILE;
  protected readonly certs = CERTIFICATIONS;
  protected readonly snippets = SNIPPETS.map((s) => ({ ...s, lines: highlight(s.code, s.lang) }));
  protected readonly tab = signal(0);
  protected readonly current = computed(() => this.snippets[this.tab()]);

  /** The career, as a commit history. */
  protected readonly gitLog = [
    {
      hash: '7c1b9aa',
      tag: 'HEAD → main',
      msg: 'release: software engineer @ natech banking solutions',
    },
    { hash: 'f00d5e1', tag: '', msg: 'feat: first production deploy @ iteam & avibright' },
    { hash: 'e2a71f0', tag: '', msg: 'feat: msc informatics, university of piraeus' },
    { hash: 'c9d04ab', tag: '', msg: 'chore: operations & sales — metro, mart, lidl' },
    { hash: '3b7e2d1', tag: '', msg: 'chore: national service, hellenic navy' },
    { hash: 'a1f3c09', tag: '', msg: 'init: agricultural engineering + hydroponics control' },
  ];

  protected readonly core = [
    { name: 'C#', note: '.NET ecosystem · services & back-ends' },
    { name: 'TypeScript', note: 'Typed front-ends & tooling' },
    { name: 'Git', note: 'Version control & team workflow' },
  ];

  protected readonly domains = [
    'Banking & financial software',
    'Enterprise applications',
    'Data retrieval & processing',
    'Automation & control systems',
  ];

  protected readonly languages = [
    { name: 'Greek', level: 'Native', value: 100 },
    { name: 'English', level: 'Full professional', value: 88 },
  ];

  protected onTabKey(e: KeyboardEvent): void {
    const n = this.snippets.length;
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      const next = (this.tab() + (e.key === 'ArrowRight' ? 1 : n - 1)) % n;
      this.tab.set(next);
      (e.currentTarget as HTMLElement).parentElement
        ?.querySelectorAll<HTMLElement>('[role="tab"]')
        [next]?.focus();
    }
  }
}
