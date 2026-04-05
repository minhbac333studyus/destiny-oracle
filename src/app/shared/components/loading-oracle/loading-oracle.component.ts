import { ChangeDetectionStrategy, Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-oracle',
  standalone: true,
  templateUrl: './loading-oracle.component.html',
  styleUrl: './loading-oracle.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingOracleComponent {
  @Input() message = 'The Oracle consults the fates…';
}
