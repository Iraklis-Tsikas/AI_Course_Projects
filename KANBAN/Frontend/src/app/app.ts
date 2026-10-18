import { Component, computed, inject } from '@angular/core';
import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import { BoardStore } from './board.store';
import { ColumnComponent } from './column/column';

@Component({
  selector: 'app-root',
  imports: [CdkDropListGroup, ColumnComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected readonly store = inject(BoardStore);
  protected readonly totalCards = computed(() =>
    this.store.columns().reduce((sum, c) => sum + c.cards.length, 0),
  );
}
