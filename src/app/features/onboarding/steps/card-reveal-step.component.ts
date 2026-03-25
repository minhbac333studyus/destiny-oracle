import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { OracleButtonComponent } from '../../../shared/components/oracle-button/oracle-button.component';
import { StageBadgeComponent } from '../../../shared/components/stage-badge/stage-badge.component';
import { CardStage } from '../../../shared/models/card-stage.model';

@Component({
  selector: 'app-card-reveal-step',
  standalone: true,
  imports: [OracleButtonComponent, StageBadgeComponent],
  templateUrl: './card-reveal-step.component.html',
  styleUrl: './card-reveal-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardRevealStepComponent {
  @Input({ required: true }) aspectLabel!: string;
  @Output() complete = new EventEmitter<void>();

  readonly stormStage = CardStage.Storm;
}
