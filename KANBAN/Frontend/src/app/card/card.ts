import { Component, input, output } from '@angular/core';
import { Card } from '../board.model';

@Component({
  selector: 'app-card',
  templateUrl: './card.html',
  styleUrl: './card.scss',
})
export class CardComponent {
  readonly card = input.required<Card>();
  readonly delete = output<void>();
}
