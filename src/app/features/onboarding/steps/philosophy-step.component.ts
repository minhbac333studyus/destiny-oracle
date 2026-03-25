import { ChangeDetectionStrategy, Component, Output, EventEmitter } from '@angular/core';
import { OracleButtonComponent } from '../../../shared/components/oracle-button/oracle-button.component';

@Component({
  selector: 'app-philosophy-step',
  standalone: true,
  imports: [OracleButtonComponent],
  templateUrl: './philosophy-step.component.html',
  styleUrl: './philosophy-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PhilosophyStepComponent {
  @Output() proceed = new EventEmitter<void>();
  @Output() back    = new EventEmitter<void>();
}
