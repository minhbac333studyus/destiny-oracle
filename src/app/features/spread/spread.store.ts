import { Injectable, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../shared/services/api.service';
import { SpreadCardSummary } from '../../shared/services/mock-card.service';
import { CardStage, STAGE_ORDER } from '../../shared/models/card-stage.model';

@Injectable()
export class SpreadStore {
  readonly #cardService = inject(ApiService);
  readonly #destroyRef  = inject(DestroyRef);

  readonly cards   = signal<SpreadCardSummary[]>([]);
  readonly loading = signal(false);
  readonly error   = signal<string | null>(null);

  readonly highestStage = computed<CardStage>(() => {
    const stages = this.cards().map(c => c.stage);
    return stages.reduce((best, s) =>
      STAGE_ORDER.indexOf(s) > STAGE_ORDER.indexOf(best) ? s : best,
      CardStage.Storm
    );
  });

  readonly totalStreak = computed(() =>
    Math.max(...this.cards().map(c => c.streakDays), 0)
  );

  load(): void {
    this.loading.set(true);
    this.#cardService.getAllCards()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe({
        next:  cards => { this.cards.set(cards); this.loading.set(false); },
        error: err   => { this.error.set(err.message); this.loading.set(false); },
      });
  }
}
