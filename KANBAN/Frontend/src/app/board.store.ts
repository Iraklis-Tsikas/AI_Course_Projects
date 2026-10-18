import { Injectable, signal } from '@angular/core';
import { moveItemInArray, transferArrayItem } from '@angular/cdk/drag-drop';
import { Column } from './board.model';
import { INITIAL_COLUMNS } from './board.data';

@Injectable({ providedIn: 'root' })
export class BoardStore {
  readonly columns = signal<Column[]>(structuredClone(INITIAL_COLUMNS));

  renameColumn(columnId: string, title: string): void {
    title = title.trim();
    if (!title) return;
    this.columns.update((cols) => cols.map((c) => (c.id === columnId ? { ...c, title } : c)));
  }

  addCard(columnId: string, title: string, details = ''): void {
    title = title.trim();
    if (!title) return;
    const card = { id: crypto.randomUUID(), title, details: details.trim() };
    this.columns.update((cols) =>
      cols.map((c) => (c.id === columnId ? { ...c, cards: [...c.cards, card] } : c)),
    );
  }

  deleteCard(columnId: string, cardId: string): void {
    this.columns.update((cols) =>
      cols.map((c) =>
        c.id === columnId ? { ...c, cards: c.cards.filter((card) => card.id !== cardId) } : c,
      ),
    );
  }

  moveCard(fromColumnId: string, toColumnId: string, fromIndex: number, toIndex: number): void {
    this.columns.update((cols) => {
      const next = cols.map((c) => ({ ...c, cards: [...c.cards] }));
      const from = next.find((c) => c.id === fromColumnId)!;
      const to = next.find((c) => c.id === toColumnId)!;
      if (from === to) moveItemInArray(from.cards, fromIndex, toIndex);
      else transferArrayItem(from.cards, to.cards, fromIndex, toIndex);
      return next;
    });
  }
}
