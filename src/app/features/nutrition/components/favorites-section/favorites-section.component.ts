import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FavoriteFood, MealType } from '../../nutrition.model';

@Component({
  selector: 'app-favorites-section',
  standalone: true,
  imports: [DecimalPipe],
  templateUrl: './favorites-section.component.html',
  styleUrl: './favorites-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FavoritesSectionComponent {
  @Input() favorites: FavoriteFood[] = [];
  @Output() quickAdd = new EventEmitter<{ fav: FavoriteFood; mealType: MealType }>();
  @Output() remove = new EventEmitter<string>();

  addToSnack(fav: FavoriteFood): void {
    this.quickAdd.emit({ fav, mealType: 'SNACK' });
  }
}
