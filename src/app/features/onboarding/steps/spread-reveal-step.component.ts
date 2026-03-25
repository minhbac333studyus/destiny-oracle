import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { OracleButtonComponent } from '../../../shared/components/oracle-button/oracle-button.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';
import { AspectFear } from '../onboarding.model';
import { CardStage } from '../../../shared/models/card-stage.model';

@Component({
  selector: 'app-spread-reveal-step',
  standalone: true,
  imports: [OracleButtonComponent, StageBadgeComponent],
  templateUrl: './spread-reveal-step.component.html',
  styleUrl: './spread-reveal-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadRevealStepComponent {
  @Input({ required: true }) fears!: AspectFear[];
  @Output() complete = new EventEmitter<void>();

  readonly stormStage = CardStage.Storm;
}
