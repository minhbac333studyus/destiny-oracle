import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  OnChanges,
} from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { StageBadgeComponent } from '../../shared/components/stage-badge/stage-badge.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring/progress-ring.component';
import { SpreadCardSummary } from '../../shared/services/mock-card.service';
import { STAGE_COLORS } from '../../shared/models/card-stage.model';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';
import { FlareData, generateFlares, cardIdHash } from '../../shared/utils/flare.util';

@Component({
  selector: 'app-spread-card-tile',
  standalone: true,
  imports: [NgClass, NgStyle, StageBadgeComponent, ProgressRingComponent, AspectIconPipe],
  templateUrl: './spread-card-tile.component.html',
  styleUrl: './spread-card-tile.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadCardTileComponent implements OnChanges {
  @Input({ required: true }) card!: SpreadCardSummary;
  @Output() tileClicked = new EventEmitter<string>();

  imageError = false;
  flares: FlareData[] = [];

  get stageColor(): string {
    return STAGE_COLORS[this.card.stage] ?? '#4a5568';
  }

  get flashCount(): number { return Math.min(Math.floor(this.card.progressPercent / 10), 10); }

  onImageError(): void { this.imageError = true; }

  ngOnChanges(): void {
    this.imageError = false;
    this.flares = this.generateFlares(this.flashCount);
  }

  private generateFlares(count: number): FlareData[] {
    return generateFlares(count, cardIdHash(this.card.id), 0.8);
  }
}
