import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { CardDetailStore } from './card-detail.store';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { LoadingOracleComponent } from '../../shared/components/loading-oracle/loading-oracle.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { CardVisualComponent } from './card-visual.component';
import { CardStageNavComponent } from './card-stage-nav.component';
import { CardStatsPanelComponent } from './card-stats-panel.component';
import { CardHabitsListComponent } from './card-habits-list.component';
import { CardStage, STAGE_ORDER, STAGE_LABELS } from '../../shared/models/card-stage.model';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-card-detail-page',
  standalone: true,
  imports: [
    NavBarComponent,
    LoadingOracleComponent,
    OracleButtonComponent,
    CardVisualComponent,
    CardStageNavComponent,
    CardStatsPanelComponent,
    CardHabitsListComponent,
    DatePipe,
  ],
  templateUrl: './card-detail-page.component.html',
  styleUrl: './card-detail-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardDetailPageComponent implements OnInit {
  @Input({ required: true }) cardId!: string;

  readonly store   = inject(CardDetailStore);
  readonly #router = inject(Router);

  readonly viewStage = signal<CardStage | null>(null);

  // ── Debug bar (dev-only) ──
  readonly isDevMode     = !environment.production;
  readonly debugOpen     = signal(false);
  readonly debugPercent  = signal(0);
  readonly debugStages   = STAGE_ORDER;
  readonly debugLabels   = STAGE_LABELS;

  readonly displayStage = computed<CardStage>(() =>
    this.viewStage() ?? this.store.card()!.stats.currentStage
  );

  readonly displayContent = computed(() => {
    const card  = this.store.card()!;
    const stage = this.displayStage();
    const sc    = card.stageContent?.[stage];
    return {
      title:   sc?.title   ?? card.cardTitle,
      tagline: sc?.tagline ?? card.cardTagline,
      lore:    sc?.lore    ?? card.loreText,
    };
  });

  /** Actual generated image for the currently viewed stage */
  readonly displayImageUrl = computed(() => {
    const card = this.store.card();
    if (!card) return '';
    const stage = this.displayStage();
    const entry = card.imageHistory?.find(i => i.stage === stage);
    return entry?.imageUrl ?? card.imageUrl ?? '';
  });

  ngOnInit(): void {
    this.store.load(this.cardId);
  }

  onStageSelected(stage: CardStage): void {
    this.viewStage.set(stage);
  }

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', goals: '/goals', profile: '/profile',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }

  onEditDream(): void {
    this.#router.navigate(['/card', this.cardId, 'edit-dream']);
  }

  onDeleteCard(): void {
    if (!confirm('Delete this card? This cannot be undone.')) return;
    this.store.deleteCard(this.cardId);
  }

  onRegenStageImage(): void {
    this.store.regenStageImage(this.cardId, this.displayStage());
  }

  // ── Debug bar helpers ──
  readonly debugInfoOpen = signal(false);

  onDebugInfoToggle(): void {
    this.debugInfoOpen.update(v => !v);
  }

  onDebugToggle(): void {
    this.debugOpen.update(v => !v);
    // Sync slider with current card stats on first open
    const card = this.store.card();
    if (card) this.debugPercent.set(card.stats.stageProgressPercent);
  }

  onDebugPercentChange(event: Event): void {
    const value = +(event.target as HTMLInputElement).value;
    this.debugPercent.set(value);
    const card = this.store.card();
    if (card) this.store.debugUpdateStats(card.stats.currentStage, value);
  }

  onDebugStageChange(stage: CardStage): void {
    const card = this.store.card();
    if (card) {
      this.store.debugUpdateStats(stage, this.debugPercent());
      this.viewStage.set(stage);
    }
  }
}
