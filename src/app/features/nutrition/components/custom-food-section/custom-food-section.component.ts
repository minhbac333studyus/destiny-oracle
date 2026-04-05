import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, NgTemplateOutlet } from '@angular/common';
import { OracleButtonComponent } from '../../../../shared/components/oracle-button/oracle-button.component';
import { CustomFood, MealType } from '../../nutrition.model';

@Component({
  selector: 'app-custom-food-section',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NgTemplateOutlet, OracleButtonComponent],
  templateUrl: './custom-food-section.component.html',
  styleUrl: './custom-food-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomFoodSectionComponent {
  @Input() customFoods: CustomFood[] = [];
  @Output() addFood = new EventEmitter<any>();
  @Output() updateFood = new EventEmitter<{ id: string; food: any }>();
  @Output() deleteFood = new EventEmitter<string>();
  @Output() toggleFavorite = new EventEmitter<string>();
  @Output() logFood = new EventEmitter<{ food: CustomFood; qty: number; mealType: MealType }>();

  showAddForm = false;
  editingId: string | null = null;

  // Form fields (shared for add + edit)
  foodName = '';
  servingSize = 100;
  servingUnit = 'g';
  calories: number | null = null;
  proteinG: number | null = null;
  fatG: number | null = null;
  carbsG: number | null = null;
  sugarG: number | null = null;

  logMealType: MealType = 'LUNCH';

  readonly units = ['g', 'ml', 'oz', 'piece', 'serving'];

  startEdit(food: CustomFood): void {
    if (this.editingId === food.id) { this.cancelEdit(); return; }
    this.editingId = food.id;
    this.foodName = food.foodName;
    this.servingSize = food.servingSize;
    this.servingUnit = food.servingUnit;
    this.calories = food.calories;
    this.proteinG = food.proteinG;
    this.fatG = food.fatG;
    this.carbsG = food.carbsG;
    this.sugarG = food.sugarG;
    this.showAddForm = false;
  }

  cancelEdit(): void {
    this.editingId = null;
  }

  saveEdit(): void {
    if (!this.editingId || !this.foodName.trim()) return;
    this.updateFood.emit({
      id: this.editingId,
      food: {
        foodName: this.foodName,
        servingSize: this.servingSize,
        servingUnit: this.servingUnit,
        calories: this.calories ?? 0,
        proteinG: this.proteinG ?? 0,
        fatG: this.fatG ?? 0,
        carbsG: this.carbsG ?? 0,
        sugarG: this.sugarG,
      },
    });
    this.editingId = null;
  }

  openAddForm(): void {
    this.editingId = null;
    this.resetForm();
    this.showAddForm = true;
  }

  submitFood(): void {
    if (!this.foodName.trim() || !this.calories) return;
    this.addFood.emit({
      foodName: this.foodName,
      servingSize: this.servingSize,
      servingUnit: this.servingUnit,
      calories: this.calories,
      proteinG: this.proteinG ?? 0,
      fatG: this.fatG ?? 0,
      carbsG: this.carbsG ?? 0,
      sugarG: this.sugarG,
    });
    this.resetForm();
    this.showAddForm = false;
  }

  quickLog(food: CustomFood): void {
    this.logFood.emit({ food, qty: food.servingSize > 0 ? food.servingSize : 1, mealType: this.logMealType });
  }

  private resetForm(): void {
    this.foodName = '';
    this.servingSize = 100;
    this.servingUnit = 'g';
    this.calories = null;
    this.proteinG = null;
    this.fatG = null;
    this.carbsG = null;
    this.sugarG = null;
  }
}
