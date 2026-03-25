import { ChangeDetectionStrategy, Component, Input, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { MockCardService } from '../../shared/services/mock-card.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';
import { RegenerateStatus } from './edit-dream.model';

@Component({
  selector: 'app-edit-dream-page',
  standalone: true,
  imports: [ReactiveFormsModule, NavBarComponent, OracleButtonComponent],
  templateUrl: './edit-dream-page.component.html',
  styleUrl: './edit-dream-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditDreamPageComponent implements OnInit {
  @Input({ required: true }) cardId!: string;

  readonly #fb          = inject(FormBuilder);
  readonly #cardService = inject(MockCardService);
  readonly #destroyRef  = inject(DestroyRef);
  readonly #router      = inject(Router);

  readonly status = signal<RegenerateStatus>('idle');

  form = this.#fb.group({
    fearText:          ['', [Validators.required, Validators.minLength(20)]],
    additionalContext: [''],
  });

  get fearControl() { return this.form.get('fearText')!; }

  ngOnInit(): void {
    this.#cardService.getCard(this.cardId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(card => {
        if (card) this.form.patchValue({ fearText: card.fearOriginal });
      });
  }

  onSubmit(): void {
    if (this.form.invalid) { this.form.markAllAsTouched(); return; }
    this.status.set('generating');
    // Simulate AI regeneration delay
    setTimeout(() => {
      this.status.set('success');
      setTimeout(() => this.#router.navigate(['/card', this.cardId]), 1200);
    }, 1800);
  }

  onCancel(): void { this.#router.navigate(['/card', this.cardId]); }
}
