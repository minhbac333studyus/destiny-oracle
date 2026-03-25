import { Injectable, signal } from '@angular/core';
import { AppUser } from '../models/app-user.model';

const ONBOARDING_KEY = 'destiny_onboarding_complete';

@Injectable({ providedIn: 'root' })
export class MockUserService {

  private readonly _user = signal<AppUser>({
    id:                 'mock-user-1',
    displayName:        'Oracle Seeker',
    email:              'seeker@destiny.app',
    avatarUrl:          null,
    chibiUrl:           null,
    onboardingComplete: this.#loadOnboardingState(),
    joinedAt:           new Date('2026-01-01'),
  });

  readonly user = this._user.asReadonly();

  isOnboardingComplete(): boolean {
    return this._user().onboardingComplete;
  }

  completeOnboarding(): void {
    this._user.update(u => ({ ...u, onboardingComplete: true }));
    localStorage.setItem(ONBOARDING_KEY, 'true');
  }

  #loadOnboardingState(): boolean {
    try {
      return localStorage.getItem(ONBOARDING_KEY) === 'true';
    } catch {
      return false;
    }
  }
}
