import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardStage, STAGE_LABELS } from '../../models/card-stage.model';

@Component({
  selector: 'app-stage-badge',
  standalone: true,
  imports: [NgClass],
  template: `
    <span class="stage-badge" [ngClass]="'stage-' + stage">
      {{ label }}
    </span>
  `,
  styleUrl: './stage-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StageBadgeComponent {
  @Input({ required: true }) stage!: CardStage;

  get label(): string {
    return STAGE_LABELS[this.stage] ?? this.stage;
  }
}
