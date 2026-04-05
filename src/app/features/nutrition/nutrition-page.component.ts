import { ChangeDetectionStrategy, Component, inject, OnInit, effect, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { NutritionStore } from './nutrition.store';
import { FoodSearchComponent } from './components/food-search/food-search.component';
import { BodyCompSectionComponent } from './components/body-comp-section/body-comp-section.component';
import { GoalSettingsComponent } from './components/goal-settings/goal-settings.component';
import { CustomFoodSectionComponent } from './components/custom-food-section/custom-food-section.component';
import { MealSectionComponent } from './components/meal-section/meal-section.component';
import { BarcodeScannerComponent } from './components/barcode-scanner/barcode-scanner.component';
import { MealType, FoodLogEntry, CustomFood, UsdaFoodItem, MEAL_ORDER } from './nutrition.model';

@Component({
  selector: 'app-nutrition-page',
  standalone: true,
  imports: [
    DecimalPipe,
    NavBarComponent,
    FoodSearchComponent,
    BodyCompSectionComponent,
    GoalSettingsComponent,
    CustomFoodSectionComponent,
    MealSectionComponent,
    BarcodeScannerComponent,
  ],
  templateUrl: './nutrition-page.component.html',
  styleUrl: './nutrition-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [NutritionStore],
})
export class NutritionPageComponent implements OnInit {
  readonly store = inject(NutritionStore);
  readonly #router = inject(Router);

  readonly showGoalSettings = signal(false);
  readonly isFirstTime = signal(false);
  readonly showMyFoods = signal(false);
  readonly showMyMeals = signal(false);
  readonly activeMealType = signal<MealType | null>(null);

  activeLogTab: 'recent' | 'favorites' = 'recent';
  showCreateMenu = false;
  readonly showScanner = signal(false);
  readonly scannedFood = signal<UsdaFoodItem | null>(null);
  readonly scanError = signal('');

  readonly mealSlots: { type: MealType; label: string; icon: string }[] = [
    { type: 'BREAKFAST', label: 'Breakfast', icon: '🥐' },
    { type: 'LUNCH',     label: 'Lunch',     icon: '🍱' },
    { type: 'DINNER',    label: 'Dinner',    icon: '🍝' },
    { type: 'SNACK',     label: 'Snack',     icon: '🍌' },
  ];

  constructor() {
    effect(() => {
      const g = this.store.goals();
      if (g && g.calorieTarget === 2000 && g.proteinGrams === 150 && g.fatGrams === 65 && g.carbGrams === 250
          && g.targetWeightKg == null) {
        this.isFirstTime.set(true);
        this.showGoalSettings.set(true);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.store.loadAll();
  }

  get caloriePercent(): number {
    return Math.min(this.store.dailySummary()?.caloriePercent ?? 0, 100);
  }

  get calorieRemaining(): number {
    const s = this.store.dailySummary();
    if (!s) return 0;
    return Math.max(0, Math.round(s.calorieTarget - s.totalCalories));
  }

  get activeMealLabel(): string {
    const t = this.activeMealType();
    return this.mealSlots.find(m => m.type === t)?.label ?? '';
  }

  getMealCalories(type: MealType): number {
    const log = this.store.foodLogByMeal();
    const entries = log.get(type);
    if (!entries) return 0;
    return entries.reduce((s, e) => s + (e.calories ?? 0), 0);
  }

  /** Get grams per 1 serving for a logged item based on its unit */
  getGramsPerServing(item: FoodLogEntry): number {
    const u = item.servingUnit?.toLowerCase() ?? 'g';
    if (u === 'g' || u === 'ml') return 1; // qty is already in grams
    if (u === 'oz') return 28.35;
    // For 'serving', 'piece' etc — estimate from macros
    // The item stores total macros for servingQty, so 1 serving = servingQty units
    return item.servingQty > 0 ? item.servingQty : 100;
  }

  /** Get the total grams for a logged item */
  getItemGrams(item: FoodLogEntry): number {
    const u = item.servingUnit?.toLowerCase() ?? 'g';
    if (u === 'g' || u === 'ml') return item.servingQty;
    if (u === 'oz') return item.servingQty * 28.35;
    // For serving-based items, we need the custom food's serving size
    const customFood = this.store.customFoods().find(f => f.foodName === item.foodName);
    if (customFood && customFood.servingSize > 0) {
      return item.servingQty * customFood.servingSize;
    }
    return item.servingQty * 100; // fallback
  }

  /** Get serving count for a logged item */
  getItemServings(item: FoodLogEntry): number {
    const u = item.servingUnit?.toLowerCase() ?? 'g';
    if (u === 'g' || u === 'ml') {
      const customFood = this.store.customFoods().find(f => f.foodName === item.foodName);
      const perServing = customFood?.servingSize ?? 100;
      return perServing > 0 ? item.servingQty / perServing : item.servingQty;
    }
    return item.servingQty;
  }

  /** Get the serving size in grams for display */
  getServingSizeGrams(item: FoodLogEntry): number {
    const customFood = this.store.customFoods().find(f => f.foodName === item.foodName);
    return customFood?.servingSize ?? 100;
  }

  /** Update by changing serving count */
  onServingChange(item: FoodLogEntry, newServings: number): void {
    if (newServings <= 0) { this.store.removeFoodEntry(item.id); return; }
    const u = item.servingUnit?.toLowerCase() ?? 'g';
    if (u === 'g' || u === 'ml') {
      const perServing = this.getServingSizeGrams(item);
      this.store.updateFoodQty(item.id, newServings * perServing);
    } else {
      this.store.updateFoodQty(item.id, newServings);
    }
  }

  /** Update by changing gram weight */
  onGramChange(item: FoodLogEntry, newGrams: number): void {
    if (newGrams <= 0) { this.store.removeFoodEntry(item.id); return; }
    const u = item.servingUnit?.toLowerCase() ?? 'g';
    if (u === 'g' || u === 'ml') {
      this.store.updateFoodQty(item.id, newGrams);
    } else if (u === 'oz') {
      this.store.updateFoodQty(item.id, newGrams / 28.35);
    } else {
      const perServing = this.getServingSizeGrams(item);
      this.store.updateFoodQty(item.id, perServing > 0 ? newGrams / perServing : newGrams);
    }
  }

  /** Set of "name|calories" keys for favorited custom foods */
  get favoritedKeys(): Set<string> {
    return new Set(
      this.store.customFoods()
        .filter(f => f.favorite)
        .map(f => `${f.foodName}|${Math.round(f.calories ?? 0)}`)
    );
  }

  onToggleSearchFav(food: any): void {
    const key = `${food.foodName}|${Math.round(food.calories ?? 0)}`;
    const existing = this.store.customFoods().find(
      f => `${f.foodName}|${Math.round(f.calories ?? 0)}` === key
    );
    if (existing) {
      this.store.toggleFavorite(existing.id);
    } else {
      this.store.addFavorite(food);
    }
  }

  get activeMealEntries(): FoodLogEntry[] {
    const mt = this.activeMealType();
    if (!mt) return [];
    return this.store.foodLogByMeal().get(mt) ?? [];
  }

  get activeMealTotalCal(): number {
    return this.activeMealEntries.reduce((s, e) => s + (e.calories ?? 0), 0);
  }

  openMealLog(type: MealType): void {
    this.activeMealType.set(type);
    this.activeLogTab = 'recent';
    this.showCreateMenu = false;
  }

  onAddFromSearch(entry: any): void {
    const mt = this.activeMealType();
    if (mt) entry.mealType = mt;
    this.store.addFoodEntry(entry);
  }

  quickLogRecent(food: FoodLogEntry): void {
    const mt = this.activeMealType() ?? 'SNACK';
    this.store.logRecent(food, mt);
  }

  isFavorited(foodName: string): boolean {
    return this.store.customFoods().some(f => f.foodName === foodName && f.favorite);
  }

  toggleRecentFavorite(food: FoodLogEntry): void {
    const existing = this.store.customFoods().find(f => f.foodName === food.foodName);
    if (existing) {
      // Already in My Foods — toggle favorite flag
      this.store.toggleFavorite(existing.id);
    } else {
      // Not in My Foods yet — create as favorite
      this.store.addFavorite({
        foodName: food.foodName,
        servingQty: food.servingQty,
        servingUnit: food.servingUnit,
        calories: food.calories,
        proteinG: food.proteinG,
        fatG: food.fatG,
        carbsG: food.carbsG,
      });
    }
  }

  quickLogFavorite(fav: CustomFood): void {
    const mt = this.activeMealType() ?? 'SNACK';
    this.store.logFavorite(fav, mt);
  }

  onBarcodeScanned(barcode: string): void {
    this.showScanner.set(false);
    this.scanError.set('');
    this.store.lookupBarcode(barcode);
  }

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', chat: '/chat',
      tasks: '/tasks', nutrition: '/nutrition',
      profile: '/profile', monitor: '/monitor', 
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }

  get dateLabel(): string {
    const d = new Date(this.store.selectedDate() + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diff = Math.round((d.getTime() - today.getTime()) / 86400000);
    if (diff === 0) return 'Today';
    if (diff === -1) return 'Yesterday';
    if (diff === 1) return 'Tomorrow';
    return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }
}
