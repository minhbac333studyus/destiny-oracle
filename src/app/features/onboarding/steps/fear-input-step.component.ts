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
import { AspectFear } from '../onboarding.model';

@Component({
  selector: 'app-fear-input-step',
  standalone: true,
  imports: [ReactiveFormsModule, OracleButtonComponent],
  templateUrl: './fear-input-step.component.html',
  styleUrl: './fear-input-step.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FearInputStepComponent {
  readonly #fb = inject(FormBuilder);

  @Input({ required: true }) set aspect(value: AspectFear) {
    this.form.patchValue({ fearText: value.fearText }, { emitEvent: false });
    this._aspect = value;
  }
  @Input({ required: true }) currentIndex!: number;
  @Input({ required: true }) totalCount!: number;

  @Output() fearSaved = new EventEmitter<{ aspectKey: string; fearText: string }>();
  @Output() back      = new EventEmitter<void>();

  _aspect!: AspectFear;

  form = this.#fb.group({
    fearText: ['', [Validators.required, Validators.minLength(20)]],
  });

  get fearControl() { return this.form.get('fearText')!; }
  get indexRange(): number[] { return Array.from({ length: this.totalCount }, (_, i) => i); }

  onNext(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.fearSaved.emit({
      aspectKey: this._aspect.aspectKey,
      fearText:  this.form.getRawValue().fearText!,
    });
  }
}
