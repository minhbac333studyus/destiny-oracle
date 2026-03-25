import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { ApiService } from '../../shared/services/api.service';

const ICON_OPTIONS = ['🎯','🌊','🔥','🌿','⚡','🎨','🧠','🏆','💫','🌙','🦋','⚔️'];

@Component({
  selector: 'app-add-aspect-page',
  standalone: true,
  imports: [ReactiveFormsModule, NavBarComponent, OracleButtonComponent],
  templateUrl: './add-aspect-page.component.html',
  styleUrl: './add-aspect-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddAspectPageComponent {
  readonly #fb     = inject(FormBuilder);
  readonly #router = inject(Router);
  readonly #api    = inject(ApiService);

  readonly iconOptions = ICON_OPTIONS;
  readonly selectedIcon = signal('🎯');
  readonly submitting = signal(false);

  form = this.#fb.group({
    label:    ['', [Validators.required, Validators.minLength(2)]],
    fearText: ['', [Validators.required, Validators.minLength(20)]],
  });

  get labelControl()    { return this.form.get('label')!; }
  get fearControl()     { return this.form.get('fearText')!; }

  selectIcon(icon: string): void { this.selectedIcon.set(icon); }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }

    this.submitting.set(true);
    const { label, fearText } = this.form.getRawValue();
    this.#api.addCard({
      aspectLabel: label!,
      fearText:    fearText!,
      dreamText:   '',
      icon:        this.selectedIcon(),
    }).subscribe({
      next: card => this.#router.navigate(['/spread'], {
        state: { generatingCardId: card.id, generatingCardLabel: label },
      }),
      error: () => this.submitting.set(false),
    });
  }

  onCancel(): void { this.#router.navigate(['/spread']); }
}
