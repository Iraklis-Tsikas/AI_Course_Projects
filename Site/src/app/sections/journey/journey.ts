import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CERTIFICATIONS, CHAPTERS, Category, EDUCATION, ROLES, Role } from '../../core/content';
import {
  formatDuration,
  formatYm,
  monthsBetween,
  nowYearFraction,
  toYearFraction,
} from '../../core/dates';
import { Reveal } from '../../shared/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

interface MapRow {
  id: string;
  label: string;
  heading: string;
  sub: string;
  period: string;
  duration: string;
  category: Category;
  left: number;
  width: number;
  clipped: boolean;
  current: boolean;
  education: boolean;
  target: string;
}

const MAP_START = 2014;
const MAP_END = 2027;

export const CATEGORY_LABEL: Record<Category, string> = {
  software: 'Software',
  operations: 'Operations & Service',
  academia: 'Academia',
};

@Component({
  selector: 'app-journey',
  imports: [SectionHead, Reveal],
  templateUrl: './journey.html',
  styleUrl: './journey.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Journey {
  private readonly doc = inject(DOCUMENT);

  protected readonly categoryLabel = CATEGORY_LABEL;
  protected readonly categories: Category[] = ['software', 'operations', 'academia'];
  protected readonly education = EDUCATION;
  protected readonly certs = CERTIFICATIONS;
  protected readonly formatYm = formatYm;

  protected readonly hovered = signal<string | null>(null);
  protected readonly focusCategory = signal<Category | null>(null);
  protected readonly flash = signal<string | null>(null);

  protected readonly years = Array.from(
    { length: MAP_END - MAP_START + 1 },
    (_, i) => MAP_START + i,
  );
  protected readonly nowPos = this.pos(nowYearFraction());

  protected readonly rows: MapRow[] = [
    ...ROLES.map((r) => this.toRow(r)),
    ...EDUCATION.map<MapRow>((e) => {
      const start = toYearFraction(e.start);
      const end = toYearFraction(e.end, true);
      return {
        id: e.id,
        label: e.short,
        heading: e.school,
        sub: e.degree,
        period: e.period,
        duration: '',
        category: 'academia',
        left: this.pos(start),
        width: this.pos(end) - this.pos(start),
        clipped: start < MAP_START,
        current: false,
        education: true,
        target: 'education',
      };
    }),
  ].sort((a, b) => a.left - b.left || b.width - a.width);

  protected readonly chapters = CHAPTERS.map((c) => ({
    ...c,
    roles: ROLES.filter((r) => r.category === c.category).map((r) => ({
      ...r,
      when: `${formatYm(r.start)} — ${formatYm(r.end)}`,
      duration: formatDuration(monthsBetween(r.start, r.end)),
    })),
  }));

  protected readonly readout = computed(() => {
    const id = this.hovered();
    return id ? (this.rows.find((r) => r.id === id) ?? null) : null;
  });

  protected countFor(category: Category): number {
    return this.rows.filter((r) => r.category === category).length;
  }

  protected isDimmed(row: MapRow): boolean {
    const h = this.hovered();
    const c = this.focusCategory();
    if (h) return h !== row.id;
    if (c) return c !== row.category;
    return false;
  }

  protected jump(row: MapRow): void {
    const el = this.doc.getElementById(row.target);
    if (!el) return;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
    this.flash.set(row.education ? null : row.id);
    setTimeout(() => this.flash.set(null), 2200);
  }

  private toRow(r: Role): MapRow {
    const start = toYearFraction(r.start);
    const end = r.end ? toYearFraction(r.end, true) : nowYearFraction();
    return {
      id: r.id,
      label: r.short,
      heading: r.company,
      sub: r.title,
      period: `${formatYm(r.start)} → ${formatYm(r.end)}`,
      duration: formatDuration(monthsBetween(r.start, r.end)),
      category: r.category,
      left: this.pos(start),
      width: Math.max(0.55, this.pos(end) - this.pos(start)),
      clipped: false,
      current: !r.end,
      education: false,
      target: `role-${r.id}`,
    };
  }

  private pos(year: number): number {
    const clamped = Math.min(Math.max(year, MAP_START), MAP_END);
    return ((clamped - MAP_START) / (MAP_END - MAP_START)) * 100;
  }
}
