import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-oracle',
  standalone: true,
  template: `
    <div class="loading-oracle">
      <div class="oracle-symbol">🔮</div>
      <p class="oracle-text">{{ message }}</p>
    </div>
  `,
  styleUrl: './loading-oracle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOracleComponent {
  @Input() message = 'The Oracle consults the fates…';
}
