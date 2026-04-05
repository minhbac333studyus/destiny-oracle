import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe, DatePipe } from '@angular/common';
import { BodyCompEntry, NutritionGoal } from '../../nutrition.model';

@Component({
  selector: 'app-body-comp-section',
  standalone: true,
  imports: [FormsModule, DecimalPipe, DatePipe],
  templateUrl: './body-comp-section.component.html',
  styleUrl: './body-comp-section.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BodyCompSectionComponent {
  @Input() history: BodyCompEntry[] = [];
  @Input() latest: BodyCompEntry | null = null;
  @Input() goals: NutritionGoal | null = null;
  @Output() addEntry = new EventEmitter<any>();

  showForm = false;
  weightKg: number | null = null;
  bodyFatPct: number | null = null;
  muscleMassPct: number | null = null;
  notes = '';

  submit(): void {
    this.addEntry.emit({
      weightKg: this.weightKg,
      bodyFatPct: this.bodyFatPct,
      muscleMassPct: this.muscleMassPct,
      notes: this.notes || undefined,
    });
    this.showForm = false;
    this.weightKg = null;
    this.bodyFatPct = null;
    this.muscleMassPct = null;
    this.notes = '';
  }

  trend(current: number | null, previous: number | null): string {
    if (current == null || previous == null) return '';
    if (current > previous) return '\u2191';
    if (current < previous) return '\u2193';
    return '\u2192';
  }
}
