import { ChangeDetectionStrategy, Component } from '@angular/core';
import { PROFILE, PROJECTS, ProjectStatus } from '../../core/content';
import { Spotlight } from '../../shared/pointer-fx';
import { Reveal } from '../../shared/reveal';
import { SectionHead } from '../../shared/section-head/section-head';

@Component({
  selector: 'app-work',
  imports: [SectionHead, Reveal, Spotlight],
  templateUrl: './work.html',
  styleUrl: './work.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Work {
  protected readonly projects = PROJECTS;
  protected readonly github = PROFILE.links.github;
  protected readonly githubHandle = PROFILE.links.github.replace(
    /^https?:\/\/(www\.)?github\.com\//,
    '',
  );

  protected readonly statusLabel: Record<ProjectStatus, string> = {
    live: 'Live',
    'in-progress': 'In development',
    planned: 'Planned',
  };
}
