import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { FoodLogEntry, MealType, MEAL_LABELS } from '../../nutrition.model';

@Component({
  selector: 'app-food-log-section',
  standalone: true,
  imports: [DecimalPipe, KeyValuePipe],
  templateUrl: './food-log-section.component.html',
  styleUrl: './food-log-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodLogSectionComponent {
  @Input() foodLogByMeal = new Map<MealType, FoodLogEntry[]>();
  @Output() removeEntry = new EventEmitter<string>();
  @Output() adjustServing = new EventEmitter<{ entryId: string; delta: number }>();

  readonly mealLabels = MEAL_LABELS;

  mealSubtotal(entries: FoodLogEntry[]): { cal: number; pro: number; fat: number; carb: number } {
    return {
      cal: entries.reduce((s, e) => s + (e.calories ?? 0), 0),
      pro: entries.reduce((s, e) => s + (e.proteinG ?? 0), 0),
      fat: entries.reduce((s, e) => s + (e.fatG ?? 0), 0),
      carb: entries.reduce((s, e) => s + (e.carbsG ?? 0), 0),
    };
  }
}
