import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { OracleButtonComponent } from '../../../shared/components/oracle-button/oracle-button.component';
import { OnboardingData } from '../onboarding.model';

@Component({
  selector: 'app-questions-step',
  standalone: true,
  imports: [ReactiveFormsModule, OracleButtonComponent],
  templateUrl: './questions-step.component.html',
  styleUrl: './questions-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuestionsStepComponent {
  readonly #fb = inject(FormBuilder);

  @Input() loading = false;
  @Output() saved = new EventEmitter<OnboardingData>();
  @Output() back  = new EventEmitter<void>();

  form = this.#fb.group({
    aspectLabel: ['', [Validators.required, Validators.minLength(2)]],
    fear1:       ['', [Validators.required, Validators.minLength(10)]],
    fear2:       ['', [Validators.required, Validators.minLength(10)]],
    fear3:       ['', [Validators.required, Validators.minLength(10)]],
    dream:       ['', [Validators.required, Validators.minLength(10)]],
  });

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    const v = this.form.getRawValue();
    this.saved.emit({
      aspectLabel: v.aspectLabel!,
      fear1: v.fear1!,
      fear2: v.fear2!,
      fear3: v.fear3!,
      dream: v.dream!,
    });
  }
}
