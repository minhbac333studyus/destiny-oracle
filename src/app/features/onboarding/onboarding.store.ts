import { Injectable, computed, signal } from '@angular/core';
import { OnboardingData, OnboardingStep } from './onboarding.model';

interface OnboardingState {
  currentStep: OnboardingStep;
  data: OnboardingData;
}

@Injectable()
export class OnboardingStore {

  readonly #state = signal<OnboardingState>({
    currentStep: 'welcome',
    data: {
      aspectLabel: '',
      fear1: '',
      fear2: '',
      fear3: '',
      dream: '',
    },
  });

  readonly currentStep = computed(() => this.#state().currentStep);
  readonly data        = computed(() => this.#state().data);

  goToStep(step: OnboardingStep): void {
    this.#state.update(s => ({ ...s, currentStep: step }));
  }

  saveData(data: OnboardingData): void {
    this.#state.update(s => ({ ...s, data }));
  }

  /** Combine the 3 fear answers into a single fear text for the backend. */
  get fearText(): string {
    const d = this.#state().data;
    return [d.fear1, d.fear2, d.fear3].filter(Boolean).join('\n\n');
  }

  /** Dream text for the backend. */
  get dreamText(): string {
    return this.#state().data.dream;
  }
}
