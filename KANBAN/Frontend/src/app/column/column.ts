import { Component, ElementRef, effect, inject, input, signal, viewChild } from '@angular/core';
import { CdkDrag, CdkDragDrop, CdkDragPlaceholder, CdkDropList } from '@angular/cdk/drag-drop';
import { Card, Column } from '../board.model';
import { BoardStore } from '../board.store';
import { CardComponent } from '../card/card';

@Component({
  selector: 'app-column',
  imports: [CdkDropList, CdkDrag, CdkDragPlaceholder, CardComponent],
  templateUrl: './column.html',
  styleUrl: './column.scss',
})
export class ColumnComponent {
  protected readonly store = inject(BoardStore);
  readonly column = input.required<Column>();

  protected readonly editing = signal(false);
  protected readonly adding = signal(false);
  private readonly titleInput = viewChild<ElementRef<HTMLInputElement>>('titleInput');
  private readonly cardTitleInput = viewChild<ElementRef<HTMLInputElement>>('cardTitle');

  constructor() {
    effect(() => this.titleInput()?.nativeElement.select());
    effect(() => this.cardTitleInput()?.nativeElement.focus());
  }

  protected saveTitle(value: string): void {
    if (!this.editing()) return;
    this.store.renameColumn(this.column().id, value);
    this.editing.set(false);
  }

  protected addCard(title: HTMLInputElement, details: HTMLTextAreaElement): void {
    this.store.addCard(this.column().id, title.value, details.value);
    title.value = '';
    details.value = '';
    title.focus();
  }

  protected drop(event: CdkDragDrop<string, string, Card>): void {
    this.store.moveCard(
      event.previousContainer.data,
      event.container.data,
      event.previousIndex,
      event.currentIndex,
    );
  }
}
