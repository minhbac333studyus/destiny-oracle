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
  templateUrl: './oracle-button.component.html',
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
