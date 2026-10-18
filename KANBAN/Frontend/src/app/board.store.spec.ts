import { TestBed } from '@angular/core/testing';
import { BoardStore } from './board.store';

describe('BoardStore', () => {
  let store: BoardStore;
  const column = (id: string) => store.columns().find((c) => c.id === id)!;
  const titles = (id: string) => column(id).cards.map((c) => c.title);

  beforeEach(() => {
    store = TestBed.inject(BoardStore);
  });

  it('seeds five columns with dummy cards', () => {
    expect(store.columns().length).toBe(5);
    expect(store.columns().every((c) => c.cards.length > 0)).toBe(true);
  });

  it('renames a column, trimming whitespace', () => {
    store.renameColumn('todo', '  Next Up  ');
    expect(column('todo').title).toBe('Next Up');
  });

  it('ignores an empty column name', () => {
    store.renameColumn('todo', '   ');
    expect(column('todo').title).toBe('To Do');
  });

  it('appends a new card with a unique id', () => {
    store.addCard('review', ' Write tests ', ' Unit and e2e ');
    store.addCard('review', 'Another');
    const cards = column('review').cards;
    expect(cards.at(-2)).toMatchObject({ title: 'Write tests', details: 'Unit and e2e' });
    expect(new Set(cards.map((c) => c.id)).size).toBe(cards.length);
  });

  it('ignores a card with an empty title', () => {
    const before = column('review').cards.length;
    store.addCard('review', '  ');
    expect(column('review').cards.length).toBe(before);
  });

  it('deletes a card', () => {
    store.deleteCard('backlog', 'c2');
    expect(titles('backlog')).toEqual(['Competitor research', 'Accessibility audit']);
  });

  it('reorders cards within a column', () => {
    store.moveCard('backlog', 'backlog', 0, 2);
    expect(titles('backlog')).toEqual(['Onboarding email sequence', 'Accessibility audit', 'Competitor research']);
  });

  it('moves a card across columns', () => {
    store.moveCard('backlog', 'done', 0, 1);
    expect(titles('backlog')).toEqual(['Onboarding email sequence', 'Accessibility audit']);
    expect(titles('done')).toEqual(['Brand color palette', 'Competitor research', 'Project kickoff']);
  });
});
