import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { OracleButtonComponent } from '../../../../shared/components/oracle-button/oracle-button.component';
import { UsdaFoodItem, MealType } from '../../nutrition.model';

@Component({
  selector: 'app-food-search',
  standalone: true,
  imports: [FormsModule, DecimalPipe, OracleButtonComponent],
  templateUrl: './food-search.component.html',
  styleUrl: './food-search.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FoodSearchComponent {
  @Input() results: UsdaFoodItem[] = [];
  @Input() searching = false;
  @Input() selectedDate = '';
  @Input() favoritedKeys: Set<string> = new Set();
  @Output() search = new EventEmitter<string>();
  @Output() addEntry = new EventEmitter<any>();
  @Output() addFavorite = new EventEmitter<any>();
  @Output() toggleFavorite = new EventEmitter<any>();

  query = '';
  expandedItem: UsdaFoodItem | null = null;
  servingQty = 1;
  servingUnit = 'serving';
  mealType: MealType = 'LUNCH';
  private debounceTimer: any;

  /** Parsed serving weight in grams for the currently expanded item */
  itemServingGrams = 100;

  readonly UNIT_TO_GRAMS: Record<string, number> = {
    'g': 1,
    'ml': 1,
    'oz': 28.3495,
    'tbsp': 15,
    'tsp': 5,
    'cup': 240,
    'piece': 100,
    'serving': 100,
  };

  readonly units = ['serving', 'g', 'ml', 'oz', 'piece', 'tbsp', 'tsp', 'cup'];

  onInput(): void {
    clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.search.emit(this.query), 300);
  }

  selectItem(item: UsdaFoodItem): void {
    this.expandedItem = this.expandedItem === item ? null : item;
    if (!item) return;

    // Parse serving size from food data (e.g. "22.0 g", "100 g", "1 cup")
    this.itemServingGrams = this.parseServingGrams(item.servingSize);
    this.UNIT_TO_GRAMS['serving'] = this.itemServingGrams;

    // Default to 1 serving
    this.servingQty = 1;
    this.servingUnit = 'serving';

    // Auto-detect piece weight
    const pieceMatch = this.PIECE_WEIGHTS.find(p => p.pattern.test(item.description));
    this.UNIT_TO_GRAMS['piece'] = pieceMatch ? pieceMatch.grams : this.itemServingGrams;
  }

  /** Parse "22.0 g" → 22, "100 g" → 100, "1 cup" → 240 */
  private parseServingGrams(servingSize: string): number {
    if (!servingSize) return 100;
    const match = servingSize.match(/([\d.]+)\s*(g|ml|oz|cup|tbsp|tsp)/i);
    if (!match) return 100;
    const val = parseFloat(match[1]);
    const unit = match[2].toLowerCase();
    const factor = this.UNIT_TO_GRAMS[unit] ?? 1;
    return val * factor;
  }

  /** Convert qty+unit to a multiplier over 100g base */
  private calcMultiplier(): number {
    const gramsPerUnit = this.UNIT_TO_GRAMS[this.servingUnit] ?? 1;
    const totalGrams = this.servingQty * gramsPerUnit;
    return totalGrams / 100;
  }

  get previewCalories(): number { return (this.expandedItem?.calories ?? 0) * this.calcMultiplier(); }
  get previewProtein(): number { return (this.expandedItem?.proteinG ?? 0) * this.calcMultiplier(); }
  get previewFat(): number { return (this.expandedItem?.fatG ?? 0) * this.calcMultiplier(); }
  get previewCarbs(): number { return (this.expandedItem?.carbsG ?? 0) * this.calcMultiplier(); }

  get servingInfo(): string {
    if (this.servingUnit !== 'serving') return '';
    return `1 serving = ${this.itemServingGrams}g`;
  }

  /** Unique key: name + rounded calories to distinguish same-named items */
  foodKey(item: UsdaFoodItem): string {
    return `${item.description}|${Math.round(item.calories ?? 0)}`;
  }

  isFav(item: UsdaFoodItem): boolean {
    return this.favoritedKeys.has(this.foodKey(item));
  }

  onToggleFav(item: UsdaFoodItem): void {
    this.toggleFavorite.emit({
      foodName: item.description,
      servingQty: this.itemServingGrams,
      servingUnit: 'g',
      calories: item.calories ?? 0,
      proteinG: item.proteinG ?? 0,
      fatG: item.fatG ?? 0,
      carbsG: item.carbsG ?? 0,
    });
  }

  addToLog(): void {
    if (!this.expandedItem) return;
    const m = this.calcMultiplier();
    const item = this.expandedItem;
    this.addEntry.emit({
      fdcId: item.fdcId,
      foodName: item.description,
      servingQty: this.servingQty,
      servingUnit: this.servingUnit,
      calories: (item.calories ?? 0) * m,
      proteinG: (item.proteinG ?? 0) * m,
      fatG: (item.fatG ?? 0) * m,
      carbsG: (item.carbsG ?? 0) * m,
      mealType: this.mealType,
    });
    this.expandedItem = null;
    this.query = '';
    this.search.emit('');
  }

  saveAsFavorite(): void {
    if (!this.expandedItem) return;
    const item = this.expandedItem;
    this.addFavorite.emit({
      fdcId: item.fdcId,
      foodName: item.description,
      servingQty: this.itemServingGrams,
      servingUnit: 'g',
      calories: item.calories ?? 0,
      proteinG: item.proteinG ?? 0,
      fatG: item.fatG ?? 0,
      carbsG: item.carbsG ?? 0,
    });
  }

  private readonly PIECE_WEIGHTS: { pattern: RegExp; grams: number }[] = [
    { pattern: /egg/i, grams: 50 },
    { pattern: /banana/i, grams: 120 },
    { pattern: /apple/i, grams: 180 },
    { pattern: /avocado/i, grams: 150 },
    { pattern: /chicken breast/i, grams: 170 },
    { pattern: /tortilla/i, grams: 45 },
    { pattern: /orange/i, grams: 130 },
    { pattern: /potato/i, grams: 150 },
    { pattern: /bagel/i, grams: 100 },
    { pattern: /muffin/i, grams: 115 },
    { pattern: /cookie/i, grams: 30 },
  ];
}
