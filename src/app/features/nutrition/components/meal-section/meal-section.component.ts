import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { OracleButtonComponent } from '../../../../shared/components/oracle-button/oracle-button.component';
import { ApiService } from '../../../../shared/services/api.service';
import { MealRecipe, MealRecipeIngredient, MealType, CustomFood, UsdaFoodItem } from '../../nutrition.model';

interface SearchableIngredient extends MealRecipeIngredient {
  searchQuery: string;
  searchResults: UsdaFoodItem[];
  searching: boolean;
  showResults: boolean;
}

@Component({
  selector: 'app-meal-section',
  standalone: true,
  imports: [FormsModule, DecimalPipe, OracleButtonComponent],
  templateUrl: './meal-section.component.html',
  styleUrl: './meal-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MealSectionComponent {
  @Input() meals: MealRecipe[] = [];
  @Input() customFoods: CustomFood[] = [];
  @Output() addMeal = new EventEmitter<{ mealName: string; servings: number; ingredients: MealRecipeIngredient[] }>();
  @Output() updateMeal = new EventEmitter<{ id: string; meal: { mealName: string; servings: number; ingredients: MealRecipeIngredient[] } }>();
  @Output() deleteMeal = new EventEmitter<string>();
  @Output() logMeal = new EventEmitter<{ meal: MealRecipe; mealType: MealType }>();

  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  showBuilder = false;
  editingMealId: string | null = null;
  mealName = '';
  servings = 1;
  ingredients: SearchableIngredient[] = [];
  logMealType: MealType = 'LUNCH';
  private debounceTimers: Map<number, any> = new Map();

  readonly units = ['g', 'ml', 'oz', 'piece', 'tbsp', 'tsp', 'cup'];

  addIngredient(): void {
    this.ingredients = [...this.ingredients, {
      foodName: '', qty: 100, unit: 'g',
      calories: 0, proteinG: 0, fatG: 0, carbsG: 0,
      searchQuery: '', searchResults: [], searching: false, showResults: false,
    }];
  }

  removeIngredient(i: number): void {
    this.ingredients = this.ingredients.filter((_, idx) => idx !== i);
  }

  onIngredientSearch(ing: SearchableIngredient, index: number): void {
    const q = ing.searchQuery.trim();
    if (q.length < 2) { ing.searchResults = []; ing.showResults = false; return; }

    clearTimeout(this.debounceTimers.get(index));
    this.debounceTimers.set(index, setTimeout(() => {
      ing.searching = true;
      ing.showResults = true;

      // Search custom foods first (local, instant)
      const customMatches: UsdaFoodItem[] = this.customFoods
        .filter(f => f.foodName.toLowerCase().includes(q.toLowerCase()))
        .map(f => ({
          fdcId: 0,
          description: f.foodName,
          brandOwner: 'My Foods',
          calories: f.calories,
          proteinG: f.proteinG,
          fatG: f.fatG,
          carbsG: f.carbsG,
          servingSize: `${f.servingSize} ${f.servingUnit}`,
          source: 'MY' as any,
        }));

      // Search USDA/OFF
      this.api.searchUsdaFoods(q, 8)
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: res => {
            ing.searchResults = [...customMatches, ...(res.foods || [])];
            ing.searching = false;
          },
          error: () => {
            ing.searchResults = customMatches;
            ing.searching = false;
          },
        });
    }, 300));
  }

  selectFood(ing: SearchableIngredient, food: UsdaFoodItem): void {
    ing.foodName = food.description;
    ing.searchQuery = food.description;
    // Macros from search are per 100g, scale to ing.qty
    const mult = ing.qty / 100;
    ing.calories = Math.round((food.calories ?? 0) * mult);
    ing.proteinG = Math.round((food.proteinG ?? 0) * mult);
    ing.fatG = Math.round((food.fatG ?? 0) * mult);
    ing.carbsG = Math.round((food.carbsG ?? 0) * mult);
    ing.showResults = false;
    // Store per-100g values for recalc on qty change
    (ing as any)._per100cal = food.calories ?? 0;
    (ing as any)._per100pro = food.proteinG ?? 0;
    (ing as any)._per100fat = food.fatG ?? 0;
    (ing as any)._per100carb = food.carbsG ?? 0;
  }

  onQtyChange(ing: SearchableIngredient): void {
    // Recalculate macros if we have per-100g values
    const p = ing as any;
    if (p._per100cal != null) {
      const mult = ing.qty / 100;
      ing.calories = Math.round(p._per100cal * mult);
      ing.proteinG = Math.round(p._per100pro * mult);
      ing.fatG = Math.round(p._per100fat * mult);
      ing.carbsG = Math.round(p._per100carb * mult);
    }
  }

  get totalCal(): number { return this.ingredients.reduce((s, i) => s + (i.calories || 0), 0); }
  get totalPro(): number { return this.ingredients.reduce((s, i) => s + (i.proteinG || 0), 0); }
  get totalFat(): number { return this.ingredients.reduce((s, i) => s + (i.fatG || 0), 0); }
  get totalCarb(): number { return this.ingredients.reduce((s, i) => s + (i.carbsG || 0), 0); }

  get perServingCal(): number { return this.servings > 0 ? this.totalCal / this.servings : 0; }
  get perServingPro(): number { return this.servings > 0 ? this.totalPro / this.servings : 0; }
  get perServingFat(): number { return this.servings > 0 ? this.totalFat / this.servings : 0; }
  get perServingCarb(): number { return this.servings > 0 ? this.totalCarb / this.servings : 0; }

  startEdit(meal: MealRecipe): void {
    this.editingMealId = meal.id;
    this.mealName = meal.mealName;
    this.servings = meal.servings;
    this.ingredients = meal.ingredients.map(i => ({
      ...i,
      searchQuery: i.foodName,
      searchResults: [],
      searching: false,
      showResults: false,
    }));
    this.showBuilder = true;
  }

  submitMeal(): void {
    if (!this.mealName.trim() || !this.ingredients.length) return;
    const payload = {
      mealName: this.mealName,
      servings: this.servings,
      ingredients: this.ingredients.map(i => ({
        foodName: i.foodName, qty: i.qty, unit: i.unit,
        calories: i.calories, proteinG: i.proteinG, fatG: i.fatG, carbsG: i.carbsG,
      })),
    };
    if (this.editingMealId) {
      this.updateMeal.emit({ id: this.editingMealId, meal: payload });
    } else {
      this.addMeal.emit(payload);
    }
    this.resetForm();
  }

  quickLogMeal(meal: MealRecipe): void {
    this.logMeal.emit({ meal, mealType: this.logMealType });
  }

  private resetForm(): void {
    this.mealName = '';
    this.servings = 1;
    this.ingredients = [];
    this.showBuilder = false;
    this.editingMealId = null;
  }
}
