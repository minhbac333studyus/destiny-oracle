import {
  ChangeDetectionStrategy,
  Component,
  Input,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type OracleButtonVariant = 'primary' | 'ghost' | 'danger';

@Component({
  selector: 'app-oracle-button',
  standalone: true,
  imports: [NgClass],
  template: `
    <button
      class="oracle-btn"
      [ngClass]="['variant-' + variant, fullWidth ? 'full-width' : '']"
      [disabled]="disabled"
      [type]="type">
      @if (loading) {
        <span class="btn-spinner"></span>
      }
      <ng-content />
    </button>
  `,
  styleUrl: './oracle-button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OracleButtonComponent {
  @Input() variant: OracleButtonVariant = 'primary';
  @Input() loading  = false;
  @Input() disabled = false;
  @Input() fullWidth = false;
  @Input() type: 'button' | 'submit' = 'button';
}
