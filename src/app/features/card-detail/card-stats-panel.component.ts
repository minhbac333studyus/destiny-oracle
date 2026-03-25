import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CardStats } from '../../shared/services/mock-card.service';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';
import { STAGE_COLORS, STAGE_LABELS } from '../../shared/models/card-stage.model';

@Component({
  selector: 'app-card-stats-panel',
  standalone: true,
  imports: [ProgressRingComponent],
  templateUrl: './card-stats-panel.component.html',
  styleUrl: './card-stats-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStatsPanelComponent {
  @Input({ required: true }) stats!: CardStats;

  get stageColor(): string { return STAGE_COLORS[this.stats.currentStage]; }
  get stageLabel(): string { return STAGE_LABELS[this.stats.currentStage]; }
}
