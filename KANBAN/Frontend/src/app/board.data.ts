import { Column } from './board.model';

export const INITIAL_COLUMNS: Column[] = [
  {
    id: 'backlog',
    title: 'Backlog',
    cards: [
      { id: 'c1', title: 'Competitor research', details: 'Summarize pricing and positioning of the top five tools.' },
      { id: 'c2', title: 'Onboarding email sequence', details: 'Draft a three-step welcome flow for new users.' },
      { id: 'c3', title: 'Accessibility audit', details: '' },
    ],
  },
  {
    id: 'todo',
    title: 'To Do',
    cards: [
      { id: 'c4', title: 'Design settings page', details: 'Profile, notifications and billing sections.' },
      { id: 'c5', title: 'Set up error monitoring', details: 'Wire up alerts for the production environment.' },
    ],
  },
  {
    id: 'in-progress',
    title: 'In Progress',
    cards: [
      { id: 'c6', title: 'Landing page redesign', details: 'New hero section and testimonials.' },
      { id: 'c7', title: 'API rate limiting', details: 'Token bucket per API key.' },
    ],
  },
  {
    id: 'review',
    title: 'Review',
    cards: [{ id: 'c8', title: 'Checkout flow copy', details: 'Awaiting feedback from marketing.' }],
  },
  {
    id: 'done',
    title: 'Done',
    cards: [
      { id: 'c9', title: 'Brand color palette', details: 'Finalized and shared with the team.' },
      { id: 'c10', title: 'Project kickoff', details: '' },
    ],
  },
];
