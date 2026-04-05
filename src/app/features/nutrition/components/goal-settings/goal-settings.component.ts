import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { OracleButtonComponent } from '../../../../shared/components/oracle-button/oracle-button.component';
import { NutritionGoal } from '../../nutrition.model';

type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';
type FitnessGoal = 'cut' | 'maintain' | 'bulk';
type Gender = 'male' | 'female';

@Component({
  selector: 'app-goal-settings',
  standalone: true,
  imports: [FormsModule, OracleButtonComponent],
  templateUrl: './goal-settings.component.html',
  styleUrl: './goal-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GoalSettingsComponent implements OnInit {
  @Input() goals: NutritionGoal | null = null;
  @Input() firstTime = false;
  @Output() save = new EventEmitter<Partial<NutritionGoal>>();
  @Output() close = new EventEmitter<void>();

  // Quick setup — user profile
  gender: Gender = 'male';
  age: number | null = null;
  heightCm: number | null = null;
  bodyWeightKg: number | null = null;
  activityLevel: ActivityLevel = 'moderate';
  fitnessGoal: FitnessGoal = 'maintain';

  // Computed / manual targets
  calorieTarget = 2000;
  proteinGrams = 150;
  fatGrams = 65;
  carbGrams = 250;
  targetWeightKg: number | null = null;
  targetBodyFatPct: number | null = null;
  targetMusclePct: number | null = null;

  // Intermediate display values
  bmr = 0;
  tdee = 0;

  showManual = false;

  readonly genderOptions: { value: Gender; label: string }[] = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
  ];

  readonly activityOptions: { value: ActivityLevel; label: string; mult: string }[] = [
    { value: 'sedentary',   label: 'Sedentary',   mult: '×1.2 — desk job, no exercise' },
    { value: 'light',       label: 'Light',        mult: '×1.375 — 1-2x/week' },
    { value: 'moderate',    label: 'Moderate',     mult: '×1.55 — 3-4x/week' },
    { value: 'active',      label: 'Active',       mult: '×1.725 — 5-6x/week' },
    { value: 'very_active', label: 'Very Active',  mult: '×1.9 — athlete / 2x daily' },
  ];

  readonly goalOptions: { value: FitnessGoal; label: string; desc: string }[] = [
    { value: 'cut',      label: 'Cut',      desc: '-500 kcal deficit' },
    { value: 'maintain', label: 'Maintain',  desc: 'Stay at current weight' },
    { value: 'bulk',     label: 'Bulk',      desc: '+300 kcal surplus' },
  ];

  private readonly ACTIVITY_MULTIPLIER: Record<ActivityLevel, number> = {
    sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725, very_active: 1.9,
  };

  ngOnInit(): void {
    if (this.goals) {
      this.calorieTarget = this.goals.calorieTarget;
      this.proteinGrams = this.goals.proteinGrams;
      this.fatGrams = this.goals.fatGrams;
      this.carbGrams = this.goals.carbGrams;
      this.targetWeightKg = this.goals.targetWeightKg;
      this.targetBodyFatPct = this.goals.targetBodyFatPct;
      this.targetMusclePct = this.goals.targetMusclePct;
      // Restore profile fields from DB
      if (this.goals.gender) this.gender = this.goals.gender as Gender;
      if (this.goals.age) this.age = this.goals.age;
      if (this.goals.heightCm) this.heightCm = this.goals.heightCm;
      if (this.goals.targetWeightKg) this.bodyWeightKg = this.goals.targetWeightKg;
      if (this.goals.activityLevel) this.activityLevel = this.goals.activityLevel as ActivityLevel;
      if (this.goals.fitnessGoal) this.fitnessGoal = this.goals.fitnessGoal as FitnessGoal;
    }
    if (this.firstTime) {
      this.showManual = false;
    }
    // Auto-calculate BMR/TDEE if all profile fields are present
    if (this.canCalculate) {
      this.calculate();
      // Restore saved macro targets (don't overwrite with recalculated values)
      if (this.goals) {
        this.calorieTarget = this.goals.calorieTarget;
        this.proteinGrams = this.goals.proteinGrams;
        this.fatGrams = this.goals.fatGrams;
        this.carbGrams = this.goals.carbGrams;
      }
    }
  }

  get canCalculate(): boolean {
    return !!this.bodyWeightKg && this.bodyWeightKg > 0
        && !!this.heightCm && this.heightCm > 0
        && !!this.age && this.age > 0;
  }

  calculate(): void {
    if (!this.canCalculate) return;

    const w = this.bodyWeightKg!;
    const h = this.heightCm!;
    const a = this.age!;

    // Mifflin-St Jeor BMR
    // Male:   10 × weight(kg) + 6.25 × height(cm) − 5 × age − 5 + 5
    // Female: 10 × weight(kg) + 6.25 × height(cm) − 5 × age − 161
    if (this.gender === 'male') {
      this.bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5);
    } else {
      this.bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
    }

    // TDEE = BMR × activity multiplier
    this.tdee = Math.round(this.bmr * this.ACTIVITY_MULTIPLIER[this.activityLevel]);

    // Goal adjustment
    let cals: number;
    if (this.fitnessGoal === 'cut') cals = this.tdee - 500;
    else if (this.fitnessGoal === 'bulk') cals = this.tdee + 300;
    else cals = this.tdee;

    // Protein: 1.8g/kg (cut), 1.6g/kg (maintain), 2.0g/kg (bulk)
    const proteinPerKg = this.fitnessGoal === 'cut' ? 1.8 : this.fitnessGoal === 'bulk' ? 2.0 : 1.6;
    const protein = Math.round(w * proteinPerKg);

    // Fat: 25% of calories
    const fat = Math.round((cals * 0.25) / 9);

    // Carbs: remainder
    const carbs = Math.round((cals - protein * 4 - fat * 9) / 4);

    this.calorieTarget = Math.round(cals);
    this.proteinGrams = protein;
    this.fatGrams = fat;
    this.carbGrams = Math.max(carbs, 50);
    this.targetWeightKg = w;
  }

  /** When user changes protein, fat, or carbs → recalculate calories */
  onMacroChanged(): void {
    this.calorieTarget = this.proteinGrams * 4 + this.fatGrams * 9 + this.carbGrams * 4;
  }

  /** When user changes calories → adjust carbs (keep protein & fat fixed) */
  onCaloriesChanged(): void {
    const proteinCal = this.proteinGrams * 4;
    const fatCal = this.fatGrams * 9;
    const remaining = this.calorieTarget - proteinCal - fatCal;
    this.carbGrams = Math.max(Math.round(remaining / 4), 0);
  }

  onSave(): void {
    this.save.emit({
      calorieTarget: this.calorieTarget,
      proteinGrams: this.proteinGrams,
      fatGrams: this.fatGrams,
      carbGrams: this.carbGrams,
      targetWeightKg: this.bodyWeightKg ?? this.targetWeightKg,
      targetBodyFatPct: this.targetBodyFatPct,
      targetMusclePct: this.targetMusclePct,
      gender: this.gender,
      age: this.age,
      heightCm: this.heightCm,
      activityLevel: this.activityLevel,
      fitnessGoal: this.fitnessGoal,
    });
  }
}
