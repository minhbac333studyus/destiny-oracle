import { Injectable, computed, signal, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ApiService } from '../../shared/services/api.service';
import { CheckinSession, HabitCheckItem } from './daily-checkin.model';

@Injectable()
export class DailyCheckinStore {
  readonly #cardService = inject(ApiService);
  readonly #destroyRef  = inject(DestroyRef);

  readonly session = signal<CheckinSession | null>(null);
  readonly loading = signal(false);

  readonly completedCount = computed(() => this.session()?.items.filter(i => i.isChecked).length ?? 0);
  readonly totalCount     = computed(() => this.session()?.items.length ?? 0);
  readonly allDone        = computed(() => this.totalCount() > 0 && this.completedCount() === this.totalCount());

  load(): void {
    this.loading.set(true);
    this.#cardService.getAllCards()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(cards => {
        const items: HabitCheckItem[] = [];
        cards.forEach(card => {
          // Build habit items from card summaries — in real app each card has full habits
          items.push({
            habitId:     `${card.id}-habit`,
            habitText:   `Check in on ${card.aspectLabel}`,
            aspectLabel: card.aspectLabel,
            aspectKey:   card.id,
            isChecked:   card.streakDays > 0,
          });
        });
        this.session.set({
          date:           new Date().toISOString().slice(0, 10),
          items,
          completedAt:    null,
          totalHabits:    items.length,
          completedCount: items.filter(i => i.isChecked).length,
        });
        this.loading.set(false);
      });
  }

  toggle(habitId: string): void {
    this.session.update(s => s ? ({
      ...s,
      items: s.items.map(i => i.habitId === habitId ? { ...i, isChecked: !i.isChecked } : i),
    }) : s);
  }
}
