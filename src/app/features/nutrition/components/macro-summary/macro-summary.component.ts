import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { ProgressRingComponent } from '../../../../shared/components/progress-ring/progress-ring.component';
import { DailyMacroSummary } from '../../nutrition.model';

@Component({
  selector: 'app-macro-summary',
  standalone: true,
  imports: [DecimalPipe, ProgressRingComponent],
  templateUrl: './macro-summary.component.html',
  styleUrl: './macro-summary.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MacroSummaryComponent {
  @Input() summary: DailyMacroSummary | null = null;
  @Output() openSettings = new EventEmitter<void>();
}
