import { ChangeDetectionStrategy, Component, Input, inject } from '@angular/core';
import { Router } from '@angular/router';
import { CardStage, STAGE_LABELS } from '../../shared/models/card-stage.model';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { StageBadgeComponent } from '../../shared/components/stage-badge/stage-badge.component';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';

@Component({
  selector: 'app-card-evolved-page',
  standalone: true,
  imports: [OracleButtonComponent, StageBadgeComponent, AspectIconPipe],
  templateUrl: './card-evolved-page.component.html',
  styleUrl: './card-evolved-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardEvolvedPageComponent {
  @Input({ required: true }) cardId!: string;

  readonly #router = inject(Router);

  // In real app these come from router state; for now use demo values
  readonly fromStage = CardStage.Storm;
  readonly toStage   = CardStage.Fog;

  get fromLabel(): string { return STAGE_LABELS[this.fromStage]; }
  get toLabel():   string { return STAGE_LABELS[this.toStage]; }

  onContinue(): void { this.#router.navigate(['/card', this.cardId]); }
  onSpread():   void { this.#router.navigate(['/spread']); }
}
