import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal } from '@angular/core';
import { NgClass } from '@angular/common';
import { PlanItemTreeComponent, PlanItemEvent, PlanItemNode } from '../plan-item-tree/plan-item-tree.component';
import { ApiService } from '../../../../shared/services/api.service';
import { SoundService } from '../../../../shared/services/sound.service';

@Component({
  selector: 'app-daily-plan-section',
  standalone: true,
  imports: [NgClass, PlanItemTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="daily-plan">
      <div class="plan-header">
        <div class="header-left">
          <h3>
            🗓️ Today's Plan
            @if (plan.version > 1) {
              <span class="version-badge">v{{ plan.version }}</span>
            }
          </h3>
          <span class="plan-meta">
            🎯 {{ plan.terminalGoal || 'Sleep' }} at {{ plan.terminalGoalTime || '21:00' }}
          </span>
        </div>
        <div class="header-actions">
          <span class="progress-text">{{ doneCount() }}/{{ totalCount() }}</span>
          <div class="progress-bar-mini">
            <div class="progress-fill-mini" [style.width.%]="progressPercent()"></div>
          </div>
        </div>
      </div>

      <div class="plan-timeline">
        @for (item of plan.items; track item.id) {
          <app-plan-item-tree
            [item]="item"
            [isChild]="false"
            (statusChanged)="onItemStatusChanged($event)" />
        }
      </div>

      @if (plan.items.length === 0) {
        <div class="empty-plan">
          <p>No items yet. Generate a plan to get started!</p>
        </div>
      }
    </div>
  `,
  styles: [`
    .daily-plan {
      margin-bottom: 24px;
      border: 1px solid var(--border);
      border-radius: 14px;
      overflow: hidden;
      background: var(--bg);
    }

    .plan-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 16px;
      background: linear-gradient(135deg, rgba(94, 207, 255, 0.08), rgba(167, 139, 250, 0.08));
      border-bottom: 1px solid var(--border);

      h3 {
        margin: 0;
        font-size: 1rem;
        color: var(--text);
      }
    }

    .version-badge {
      font-size: 0.7rem;
      background: var(--purple);
      color: white;
      padding: 1px 6px;
      border-radius: 4px;
      margin-left: 6px;
    }

    .plan-meta {
      font-size: 0.8rem;
      color: var(--muted);
      margin-top: 2px;
      display: block;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .progress-text {
      font-size: 0.8rem;
      color: var(--muted);
      font-variant-numeric: tabular-nums;
    }

    .progress-bar-mini {
      width: 60px;
      height: 6px;
      background: var(--bg3);
      border-radius: 3px;
      overflow: hidden;
    }

    .progress-fill-mini {
      height: 100%;
      background: linear-gradient(90deg, var(--accent), var(--success));
      border-radius: 3px;
      transition: width 0.3s ease;
    }

    .plan-timeline {
      padding: 8px 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .empty-plan {
      padding: 24px;
      text-align: center;
      color: var(--muted);
      font-size: 0.9rem;
    }
  `]
})
export class DailyPlanSectionComponent {
  @Input({ required: true }) plan!: any;
  @Output() planUpdated = new EventEmitter<void>();

  private readonly api = inject(ApiService);
  private readonly sound = inject(SoundService);

  doneCount(): number {
    return this.countByStatus('DONE');
  }

  totalCount(): number {
    return this.plan?.items?.length || 0;
  }

  progressPercent(): number {
    const total = this.totalCount();
    return total > 0 ? (this.doneCount() / total) * 100 : 0;
  }

  onItemStatusChanged(event: PlanItemEvent) {
    this.api.updatePlanItem(event.itemId, event.status).subscribe({
      next: () => {
        if (event.status === 'DONE') {
          this.sound.play(event.isChild ? 'confirm' : 'complete');
        }
        // Update local state
        this.updateItemInTree(this.plan.items, event.itemId, event.status);
        this.planUpdated.emit();
      },
    });
  }

  private updateItemInTree(items: PlanItemNode[], itemId: string, status: string): boolean {
    for (const item of items) {
      if (item.id === itemId) {
        item.status = status as any;
        return true;
      }
      if (item.children && this.updateItemInTree(item.children, itemId, status)) {
        return true;
      }
    }
    return false;
  }

  private countByStatus(status: string): number {
    return (this.plan?.items || []).filter((i: any) => i.status === status).length;
  }
}
