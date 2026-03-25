import { ChangeDetectionStrategy, Component, Output, EventEmitter } from '@angular/core';
import { OracleButtonComponent } from '../../../shared/components/oracle-button/oracle-button.component';

@Component({
  selector: 'app-welcome-step',
  standalone: true,
  imports: [OracleButtonComponent],
  templateUrl: './welcome-step.component.html',
  styleUrl: './welcome-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeStepComponent {
  @Output() proceed = new EventEmitter<void>();
}
