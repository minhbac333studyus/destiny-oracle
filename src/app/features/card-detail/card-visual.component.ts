import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { NgClass, NgStyle } from '@angular/common';
import { CardStage, STAGE_LABELS } from '../../shared/models/card-stage.model';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';

export interface FlareData {
  id: number;
  variant: number;   // 1–5 different flare styles
  top: string;
  left: string;
  delay: string;
  scale: number;
}

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
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      variant: (i % 5) + 1,
      top: `${Math.floor(this.pseudoRandom(i * 3 + 1) * 78 + 6)}%`,
      left: `${Math.floor(this.pseudoRandom(i * 7 + 3) * 78 + 6)}%`,
      delay: `${(this.pseudoRandom(i * 11 + 5) * 2.8).toFixed(1)}s`,
      scale: 0.6 + this.pseudoRandom(i * 13 + 7) * 0.9,
    }));
  }

  private generateGlitter(count: number): GlitterData[] {
    const silverMix = this.stage === CardStage.Storm || this.stage === CardStage.Fog;
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      left:     `${Math.floor(this.pseudoRandom(i * 5 + 100) * 90 + 5)}%`,
      bottom:   `${Math.floor(this.pseudoRandom(i * 7 + 200) * 10)}%`,
      size:     2 + Math.floor(this.pseudoRandom(i * 3 + 300) * 3),
      delay:    `${(this.pseudoRandom(i * 11 + 400) * 3).toFixed(1)}s`,
      duration: `${(2.5 + this.pseudoRandom(i * 13 + 500) * 2).toFixed(1)}s`,
      isGold:   silverMix ? (i % 2 !== 0) : true,
    }));
  }

  /** Deterministic pseudo-random per seed so positions are stable across CD cycles */
  private pseudoRandom(seed: number): number {
    const x = Math.sin(seed * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  }
}
