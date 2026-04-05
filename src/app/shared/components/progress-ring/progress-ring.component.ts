import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  templateUrl: './progress-ring.component.html',
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
