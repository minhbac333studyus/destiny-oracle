export type MealType = 'BREAKFAST' | 'LUNCH' | 'DINNER' | 'SNACK';

export interface NutritionGoal {
  calorieTarget: number;
  proteinGrams: number;
  fatGrams: number;
  carbGrams: number;
  targetWeightKg: number | null;
  targetBodyFatPct: number | null;
  targetMusclePct: number | null;
  gender: string | null;
  age: number | null;
  heightCm: number | null;
  activityLevel: string | null;
  fitnessGoal: string | null;
}

/**
 * A food log entry — a single food logged for a date+meal.
 * Also used as the shape for "recent foods" and meal ingredients.
 */
export interface FoodLogEntry {
  id: string;
  fdcId: number | null;
  foodName: string;
  servingQty: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  mealType: MealType;
  logDate: string;
}

export interface DailyMacroSummary {
  totalCalories: number;
  totalProtein: number;
  totalFat: number;
  totalCarbs: number;
  calorieTarget: number;
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  caloriePercent: number;
  proteinPercent: number;
  fatPercent: number;
  carbPercent: number;
}

export interface BodyCompEntry {
  id: string;
  logDate: string;
  weightKg: number | null;
  bodyFatPct: number | null;
  muscleMassPct: number | null;
  notes: string | null;
}

export interface UsdaFoodItem {
  fdcId: number;
  description: string;
  brandOwner: string | null;
  calories: number | null;
  proteinG: number | null;
  fatG: number | null;
  carbsG: number | null;
  servingSize: string;
  source: string;
}

/**
 * Custom food in the user's personal database.
 * favorite=true means it shows in the Favorites tab for quick re-add.
 * Also used as meal ingredients — a meal is just a group of CustomFoods with quantities.
 */
export interface CustomFood {
  id: string;
  foodName: string;
  servingSize: number;
  servingUnit: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG: number | null;
  favorite: boolean;
}

/**
 * A saved meal recipe — a named group of ingredients (CustomFood shape) with servings.
 * Per-serving macros are computed by backend.
 */
export interface MealRecipe {
  id: string;
  mealName: string;
  servings: number;
  totalCalories: number;
  totalProteinG: number;
  totalFatG: number;
  totalCarbsG: number;
  totalSugarG: number | null;
  caloriesPerServing: number;
  proteinPerServing: number;
  fatPerServing: number;
  carbsPerServing: number;
  ingredients: MealRecipeIngredient[];
}

/** Ingredient within a MealRecipe — same core fields as CustomFood */
export interface MealRecipeIngredient {
  id?: string;
  foodName: string;
  qty: number;
  unit: string;
  calories: number;
  proteinG: number;
  fatG: number;
  carbsG: number;
  sugarG?: number;
}

export const MEAL_ORDER: MealType[] = ['BREAKFAST', 'LUNCH', 'DINNER', 'SNACK'];

export const MEAL_LABELS: Record<MealType, string> = {
  BREAKFAST: 'Breakfast',
  LUNCH: 'Lunch',
  DINNER: 'Dinner',
  SNACK: 'Snack',
};
