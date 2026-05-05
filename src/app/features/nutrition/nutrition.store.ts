import { Injectable, DestroyRef, inject, signal, computed } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../shared/services/api.service';
import {
  NutritionGoal, FoodLogEntry, DailyMacroSummary,
  BodyCompEntry, UsdaFoodItem,
  CustomFood, MealRecipe, MealRecipeIngredient,
  MealType, MEAL_ORDER,
} from './nutrition.model';

@Injectable()
export class NutritionStore {
  private readonly api = inject(ApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly selectedDate = signal(this.todayStr());
  readonly goals = signal<NutritionGoal | null>(null);
  readonly foodLog = signal<FoodLogEntry[]>([]);
  readonly dailySummary = signal<DailyMacroSummary | null>(null);
  readonly bodyCompHistory = signal<BodyCompEntry[]>([]);
  readonly usdaResults = signal<UsdaFoodItem[]>([]);
  readonly recentFoods = signal<FoodLogEntry[]>([]);
  readonly customFoods = signal<CustomFood[]>([]);
  readonly mealRecipes = signal<MealRecipe[]>([]);
  readonly loading = signal(false);
  readonly searching = signal(false);

  /** Favorites are custom foods with favorite=true */
  readonly favorites = computed(() => this.customFoods().filter(f => f.favorite));

  readonly foodLogByMeal = computed(() => {
    const log = this.foodLog();
    const grouped = new Map<MealType, FoodLogEntry[]>();
    for (const meal of MEAL_ORDER) {
      const items = log.filter(e => e.mealType === meal);
      if (items.length) grouped.set(meal, items);
    }
    return grouped;
  });

  readonly latestBodyComp = computed(() => this.bodyCompHistory()[0] ?? null);

  loadAll(): void {
    this.loading.set(true);
    const date = this.selectedDate();

    this.api.getNutritionGoals()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(g => this.goals.set(g));

    this.api.getFoodLog(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => this.foodLog.set(entries));

    this.api.getDailySummary(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => { this.dailySummary.set(s); this.loading.set(false); });

    this.api.getBodyCompHistory()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(h => this.bodyCompHistory.set(h));


    this.api.getCustomFoods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(f => this.customFoods.set(f));

    this.api.getMealRecipes()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(m => this.mealRecipes.set(m));

    this.api.getRecentFoods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(f => this.recentFoods.set(f));
  }

  changeDate(date: string): void {
    this.selectedDate.set(date);
    this.refreshDayData();
  }

  prevDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() - 1);
    this.changeDate(this.formatDate(d));
  }

  nextDay(): void {
    const d = new Date(this.selectedDate());
    d.setDate(d.getDate() + 1);
    this.changeDate(this.formatDate(d));
  }

  searchFood(query: string): void {
    if (!query.trim()) { this.usdaResults.set([]); return; }
    this.searching.set(true);
    this.api.searchUsdaFoods(query)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: res => { this.usdaResults.set(res.foods || []); this.searching.set(false); },
        error: () => this.searching.set(false),
      });
  }

  readonly barcodeResult = signal<any>(null);
  readonly barcodeError = signal('');

  lookupBarcode(barcode: string): void {
    this.searching.set(true);
    this.barcodeError.set('');
    this.barcodeResult.set(null);
    this.api.lookupBarcode(barcode)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: item => {
          if (item) {
            // Show as single search result so user can add it
            this.usdaResults.set([{
              fdcId: item.fdcId ?? 0,
              description: item.description ?? 'Scanned product',
              brandOwner: item.brandOwner,
              calories: item.calories,
              proteinG: item.proteinG,
              fatG: item.fatG,
              carbsG: item.carbsG,
              servingSize: item.servingSize ?? '100 g',
              source: item.source ?? 'OFF',
            }]);
            this.barcodeResult.set(item);
          } else {
            this.barcodeError.set('Product not found for this barcode');
          }
          this.searching.set(false);
        },
        error: () => {
          this.barcodeError.set('Barcode lookup failed');
          this.searching.set(false);
        },
      });
  }

  addFoodEntry(entry: {
    fdcId?: number; foodName: string; servingQty: number; servingUnit: string;
    calories: number; proteinG: number; fatG: number; carbsG: number; mealType: MealType;
  }): void {
    // Check if same food + meal type already logged today → increment qty
    const existing = this.foodLog().find(
      e => e.foodName === entry.foodName && e.mealType === entry.mealType
    );
    if (existing) {
      const newQty = existing.servingQty + entry.servingQty;
      this.updateFoodQty(existing.id, newQty);
      return;
    }
    this.api.addFoodLogEntry({ ...entry, logDate: this.selectedDate() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDayData());
  }

  updateServingQty(entryId: string, delta: number): void {
    const entry = this.foodLog().find(e => e.id === entryId);
    if (!entry) return;
    const newQty = entry.servingQty + delta;
    if (newQty < 1) return;
    this.api.updateFoodLogServingQty(entryId, newQty)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDayData());
  }

  updateFoodQty(entryId: string, newQty: number): void {
    if (newQty <= 0) { this.removeFoodEntry(entryId); return; }
    this.api.updateFoodLogQty(entryId, newQty)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDayData());
  }

  removeFoodEntry(entryId: string): void {
    this.api.removeFoodLogEntry(entryId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.refreshDayData());
  }

  addBodyComp(entry: { weightKg?: number; bodyFatPct?: number; muscleMassPct?: number; notes?: string }): void {
    this.api.addBodyCompEntry({ ...entry, logDate: this.selectedDate() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(e => this.bodyCompHistory.update(h => [e, ...h]));
  }

  /** Save a food from search as a custom food with favorite=true */
  addFavorite(fav: {
    fdcId?: number; foodName: string; servingQty: number; servingUnit: string;
    calories: number; proteinG: number; fatG: number; carbsG: number;
  }): void {
    this.api.addCustomFood({
      foodName: fav.foodName,
      servingSize: fav.servingQty,
      servingUnit: fav.servingUnit,
      calories: fav.calories,
      proteinG: fav.proteinG,
      fatG: fav.fatG,
      carbsG: fav.carbsG,
      favorite: true,
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(f => this.customFoods.update(list => [...list, f]));
  }

  toggleFavorite(id: string): void {
    this.api.toggleCustomFoodFavorite(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.customFoods.update(list =>
        list.map(f => f.id === id ? updated : f)));
  }

  /** Log a favorite (custom food) to the food log */
  logFavorite(fav: CustomFood, mealType: MealType): void {
    this.logCustomFood(fav, fav.servingSize, mealType);
  }

  // ── Custom Foods ──────────────────────────────────────────────────────

  addCustomFood(food: {
    foodName: string; servingSize: number; servingUnit: string;
    calories: number; proteinG: number; fatG: number; carbsG: number; sugarG?: number;
  }): void {
    this.api.addCustomFood(food)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(f => this.customFoods.update(list => [...list, f]));
  }

  updateCustomFood(id: string, food: any): void {
    this.api.updateCustomFood(id, food)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.customFoods.update(list =>
        list.map(f => f.id === id ? updated : f)));
  }

  deleteCustomFood(id: string): void {
    this.api.deleteCustomFood(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.customFoods.update(list => list.filter(f => f.id !== id)));
  }

  logCustomFood(food: CustomFood, qty: number, mealType: MealType): void {
    const serving = food.servingSize > 0 ? food.servingSize : 1;
    const mult = qty / serving;
    this.addFoodEntry({
      foodName: food.foodName,
      servingQty: qty,
      servingUnit: food.servingUnit,
      calories: (food.calories ?? 0) * mult,
      proteinG: (food.proteinG ?? 0) * mult,
      fatG: (food.fatG ?? 0) * mult,
      carbsG: (food.carbsG ?? 0) * mult,
      mealType,
    });
  }

  // ── Meal Recipes ──────────────────────────────────────────────────────

  addMealRecipe(meal: {
    mealName: string; servings: number; ingredients: MealRecipeIngredient[];
  }): void {
    this.api.addMealRecipe(meal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(m => this.mealRecipes.update(list => [m, ...list]));
  }

  updateMealRecipe(id: string, meal: any): void {
    this.api.updateMealRecipe(id, meal)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(updated => this.mealRecipes.update(list =>
        list.map(m => m.id === id ? updated : m)));
  }

  deleteMealRecipe(id: string): void {
    this.api.deleteMealRecipe(id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.mealRecipes.update(list => list.filter(m => m.id !== id)));
  }

  /** Log 1 serving of a meal as a food log entry */
  logMeal(meal: MealRecipe, mealType: MealType): void {
    this.addFoodEntry({
      foodName: meal.mealName,
      servingQty: 1,
      servingUnit: 'serving',
      calories: meal.caloriesPerServing,
      proteinG: meal.proteinPerServing,
      fatG: meal.fatPerServing,
      carbsG: meal.carbsPerServing,
      mealType,
    });
  }

  updateGoals(goals: Partial<NutritionGoal>): void {
    this.api.updateNutritionGoals(goals)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(g => { this.goals.set(g); this.refreshDayData(); });
  }

  /** Re-log a recent food entry to today's log */
  logRecent(entry: FoodLogEntry, mealType: MealType): void {
    this.addFoodEntry({
      fdcId: entry.fdcId ?? undefined,
      foodName: entry.foodName,
      servingQty: entry.servingQty,
      servingUnit: entry.servingUnit,
      calories: entry.calories,
      proteinG: entry.proteinG,
      fatG: entry.fatG,
      carbsG: entry.carbsG,
      mealType,
    });
  }

  private refreshDayData(): void {
    const date = this.selectedDate();
    this.api.getFoodLog(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(entries => this.foodLog.set(entries));
    this.api.getDailySummary(date)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => this.dailySummary.set(s));
    this.api.getRecentFoods()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(f => this.recentFoods.set(f));
  }

  private todayStr(): string { return this.formatDate(new Date()); }

  private formatDate(d: Date): string {
    return d.toISOString().split('T')[0];
  }
}
