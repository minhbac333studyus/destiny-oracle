import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { OnboardingStore } from './onboarding.store';
import { AuthService } from '../../shared/services/auth.service';
import { ApiService } from '../../shared/services/api.service';
import { WelcomeStepComponent } from './steps/welcome-step.component';
import { QuestionsStepComponent } from './steps/questions-step.component';
import { CardRevealStepComponent } from './steps/card-reveal-step.component';
import { OnboardingData } from './onboarding.model';

@Component({
  selector: 'app-onboarding-shell',
  standalone: true,
  imports: [
    WelcomeStepComponent,
    QuestionsStepComponent,
    CardRevealStepComponent,
  ],
  templateUrl: './onboarding-shell.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [OnboardingStore],
})
export class OnboardingShellComponent {
  readonly store        = inject(OnboardingStore);
  readonly #auth        = inject(AuthService);
  readonly #api         = inject(ApiService);
  readonly #router      = inject(Router);

  readonly creating = signal(false);
  readonly cardId   = signal<string | null>(null);

  onQuestionsSaved(data: OnboardingData): void {
    this.store.saveData(data);
    this.creating.set(true);

    // Create the first card via API
    this.#api.addCard({
      aspectLabel: data.aspectLabel,
      fearText: [data.fear1, data.fear2, data.fear3].filter(Boolean).join('\n\n'),
      dreamText: data.dream,
    }).subscribe({
      next: (card) => {
        this.cardId.set(card.id);
        this.creating.set(false);
        this.store.goToStep('card-reveal');
      },
      error: () => {
        this.creating.set(false);
        this.store.goToStep('card-reveal');
      },
    });
  }

  onComplete(): void {
    this.#auth.completeOnboarding();
    this.#router.navigate(['/spread']);
  }
}
