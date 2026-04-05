import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { CardStage, STAGE_LABELS } from '../../shared/models/card-stage.model';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';
import { FlareData, generateFlares, pseudoRandom } from '../../shared/utils/flare.util';

export interface GlitterData {
  id: number;
  left: string;
  bottom: string;
  size: number;
  delay: string;
  duration: string;
  isGold: boolean;   // false = silver (storm/fog only)
}

@Component({
  selector: 'app-card-visual',
  standalone: true,
  imports: [NgClass, NgStyle, AspectIconPipe],
  templateUrl: './card-visual.component.html',
  styleUrl: './card-visual.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardVisualComponent implements OnChanges {
  @Input({ required: true }) stage!: CardStage;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) aspectKey!: string;
  @Input() tagline = '';
  @Input() progressPercent = 0;
  @Input() imageUrl = '';

  imageError = false;
  flares: FlareData[] = [];
  glitter: GlitterData[] = [];

  get stageLabel(): string { return STAGE_LABELS[this.stage] ?? this.stage; }
  get flashCount(): number { return Math.min(Math.floor(this.progressPercent / 10), 10); }
  get isCracked(): boolean { return this.progressPercent === 0; }
  /** Pulse only when about to evolve (90%+) — legend is the final stage, no pulse needed */
  get nearEvolved(): boolean { return this.progressPercent >= 90 && this.stage !== CardStage.Legend; }

  /** Glitter count: +2 particles per 10% progress (0→0, 50%→10, 100%→20) */
  get glitterCount(): number { return Math.floor(this.progressPercent / 5); }

  onImageError(): void { this.imageError = true; }

  ngOnChanges(): void {
    this.imageError = false;
    this.flares = this.generateFlares(this.flashCount);
    this.glitter = this.generateGlitter(this.glitterCount);
  }

  private generateFlares(count: number): FlareData[] {
    return generateFlares(count);
  }

  private generateGlitter(count: number): GlitterData[] {
    const silverMix = this.stage === CardStage.Storm || this.stage === CardStage.Fog;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     `${Math.floor(pseudoRandom(i * 5 + 100) * 90 + 5)}%`,
      bottom:   `${Math.floor(pseudoRandom(i * 7 + 200) * 10)}%`,
      size:     2 + Math.floor(pseudoRandom(i * 3 + 300) * 3),
      delay:    `${(pseudoRandom(i * 11 + 400) * 3).toFixed(1)}s`,
      duration: `${(2.5 + pseudoRandom(i * 13 + 500) * 2).toFixed(1)}s`,
      isGold:   silverMix ? (i % 2 !== 0) : true,
    }));
  }
}
