import { Injectable, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ApiService } from '../../shared/services/api.service';
import { CardDetail } from '../../shared/services/mock-card.service';
import { CardStage, nextStage } from '../../shared/models/card-stage.model';

@Injectable()
export class CardDetailStore {
  readonly #cardService = inject(ApiService);
  readonly #destroyRef  = inject(DestroyRef);
  readonly #router      = inject(Router);

  readonly card         = signal<CardDetail | null>(null);
  readonly loading      = signal(false);
  readonly error        = signal<string | null>(null);
  readonly regenLoading = signal(false);

  readonly nextStage = computed(() => {
    const c = this.card();
    return c ? nextStage(c.stats.currentStage) : null;
  });

  load(cardId: string): void {
    this.loading.set(true);
    this.#cardService.getCard(cardId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: card => {
          this.card.set(card ?? null);
          if (!card) this.error.set('Card not found');
          this.loading.set(false);
        },
        error: err => { this.error.set(err.message); this.loading.set(false); },
      });
  }

  deleteCard(cardId: string): void {
    this.#cardService.deleteCard(cardId)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({ next: () => this.#router.navigate(['/spread']) });
  }

  regenStageImage(cardId: string, stage: CardStage): void {
    this.regenLoading.set(true);
    this.#cardService.generateStageImage(cardId, stage)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next: () => { this.load(cardId); this.regenLoading.set(false); },
        error: () => this.regenLoading.set(false),
      });
  }

  /** Debug-only: override stage + progress locally (no API call). */
  debugUpdateStats(stage: CardStage, progressPercent: number): void {
    this.card.update(c => c ? ({
      ...c,
      stats: { ...c.stats, currentStage: stage, stageProgressPercent: progressPercent },
    }) : c);
  }

  toggleHabit(habitId: string): void {
    const card = this.card();
    if (!card) return;
    const habit = card.habits.find(h => h.id === habitId);
    if (!habit) return;
    const updated = !habit.completedToday;
    this.card.update(c => c ? ({
      ...c,
      habits: c.habits.map(h => h.id === habitId ? { ...h, completedToday: updated } : h),
    }) : c);
    this.#cardService.completeHabit(card.id, habitId, updated)
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe();
  }
}
