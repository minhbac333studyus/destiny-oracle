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

interface FlareData {
  id: number;
  variant: number;
  top: string;
  left: string;
  delay: string;
  scale: number;
}

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
    const base = this.cardHash();
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      variant: (i % 5) + 1,
      top: `${Math.floor(this.pseudoRandom(base + i * 3 + 1) * 78 + 6)}%`,
      left: `${Math.floor(this.pseudoRandom(base + i * 7 + 3) * 78 + 6)}%`,
      delay: `${(this.pseudoRandom(base + i * 11 + 5) * 2.8).toFixed(1)}s`,
      scale: 0.6 + this.pseudoRandom(base + i * 13 + 7) * 0.8,
    }));
  }

  /** Turn card ID string into a numeric offset so each card gets unique positions */
  private cardHash(): number {
    let h = 0;
    for (let i = 0; i < this.card.id.length; i++) {
      h = Math.imul(31, h) + this.card.id.charCodeAt(i) | 0;
    }
    return Math.abs(h) % 1000;
  }

  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }
}
