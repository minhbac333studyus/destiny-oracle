import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({ providedIn: 'root' })
export class NavigationService {

  readonly #router = inject(Router);

  toSpread(): void {
    this.#router.navigate(['/spread']);
  }

  toCard(cardId: string): void {
    this.#router.navigate(['/card', cardId]);
  }

  toCardEvolved(cardId: string): void {
    this.#router.navigate(['/card', cardId, 'evolved']);
  }

  toEditDream(cardId: string): void {
    this.#router.navigate(['/card', cardId, 'edit-dream']);
  }

  toCheckin(): void {
    this.#router.navigate(['/checkin']);
  }

  toAddAspect(): void {
    this.#router.navigate(['/add-aspect']);
  }

  toProfile(): void {
    this.#router.navigate(['/profile']);
  }

  back(): void {
    history.back();
  }
}
