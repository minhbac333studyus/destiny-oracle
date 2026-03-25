import { ChangeDetectionStrategy, Component, Input, Output, EventEmitter } from '@angular/core';
import { NgClass } from '@angular/common';
import { CardStage, STAGE_LABELS, STAGE_ORDER, STAGE_DAYS } from '../../shared/models/card-stage.model';

@Component({
  selector: 'app-card-stage-nav',
  standalone: true,
  imports: [NgClass],
  templateUrl: './card-stage-nav.component.html',
  styleUrl: './card-stage-nav.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardStageNavComponent {
  @Input({ required: true }) currentStage!: CardStage;
  @Input() viewedStage: CardStage | null = null;
  @Output() stageSelected = new EventEmitter<CardStage>();

  readonly stages = STAGE_ORDER;

  label(s: CardStage): string { return STAGE_LABELS[s]; }
  days(s: CardStage):  string { return STAGE_DAYS[s]; }

  isReached(s: CardStage): boolean {
    return STAGE_ORDER.indexOf(s) <= STAGE_ORDER.indexOf(this.currentStage);
  }

  isActive(s: CardStage): boolean {
    return s === (this.viewedStage ?? this.currentStage);
  }
}
