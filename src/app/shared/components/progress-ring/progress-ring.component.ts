import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  template: `
    <div class="ring-wrapper" [style.width.px]="size" [style.height.px]="size">
      <svg [attr.width]="size" [attr.height]="size" class="progress-ring">
        <defs>
          <linearGradient [attr.id]="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" [attr.stop-color]="color" />
            <stop offset="100%" stop-color="var(--rose, #f472b6)" />
          </linearGradient>
        </defs>
        <circle
          class="track"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
        />
        <circle
          class="fill"
          [attr.cx]="center"
          [attr.cy]="center"
          [attr.r]="radius"
          fill="none"
          [attr.stroke-width]="strokeWidth"
          [attr.stroke]="'url(#' + gradientId + ')'"
          [attr.stroke-dasharray]="circumference"
          [attr.stroke-dashoffset]="dashOffset"
          stroke-linecap="round"
          [attr.transform]="'rotate(-90,' + center + ',' + center + ')'"
        />
      </svg>
      <span class="ring-label">{{ percent }}%</span>
    </div>
  `,
  styleUrl: './progress-ring.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProgressRingComponent {
  @Input() percent = 0;
  @Input() size    = 56;
  @Input() color   = 'var(--accent, #5ecfff)';

  private static nextId = 0;
  readonly gradientId = `prog-grad-${ProgressRingComponent.nextId++}`;

  get strokeWidth(): number { return Math.max(4, this.size / 12); }
  get center(): number { return this.size / 2; }
  get radius(): number { return this.center - this.strokeWidth; }
  get circumference(): number { return 2 * Math.PI * this.radius; }
  get dashOffset(): number {
    return this.circumference * (1 - Math.min(this.percent, 100) / 100);
  }
}
