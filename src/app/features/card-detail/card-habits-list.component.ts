import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardHabit } from '../../shared/services/mock-card.service';

@Component({
  selector: 'app-card-habits-list',
  standalone: true,
  imports: [NgClass],
  templateUrl: './card-habits-list.component.html',
  styleUrl: './card-habits-list.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHabitsListComponent {
  @Input({ required: true }) habits!: CardHabit[];
  @Output() habitToggled = new EventEmitter<string>();
}
