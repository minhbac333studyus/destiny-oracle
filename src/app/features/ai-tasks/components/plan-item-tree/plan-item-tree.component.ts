import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { NgClass } from '@angular/common';

export interface PlanItemNode {
  id: string;
  title: string;
  description?: string;
  category: string;
  scheduledTime?: string;
  estimatedDurationMinutes?: number;
  status: 'PENDING' | 'DONE' | 'SKIPPED' | 'RESCHEDULED';
  isPrep?: boolean;
  reminderTime?: string;
  aiGenerated?: boolean;
  children?: PlanItemNode[];
}

export interface PlanItemEvent {
  itemId: string;
  status: string;
  isChild: boolean;
}

@Component({
  selector: 'app-plan-item-tree',
  standalone: true,
  imports: [NgClass, PlanItemTreeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plan-item" [ngClass]="{ done: item.status === 'DONE', skipped: item.status === 'SKIPPED', child: isChild }">

      <!-- Parent item: has time, category, full actions -->
      @if (!isChild) {
        <div class="item-row parent-row">
          <span class="item-time">{{ item.scheduledTime || '' }}</span>
          <span class="category-badge" [ngClass]="item.category.toLowerCase()">{{ categoryIcon(item.category) }}</span>
          <span class="item-title" [ngClass]="{ crossed: item.status === 'DONE' || item.status === 'SKIPPED' }">
            {{ item.title }}
          </span>
          @if (item.estimatedDurationMinutes) {
            <span class="duration">{{ item.estimatedDurationMinutes }}m</span>
          }
          <div class="item-actions">
            @if (item.status === 'PENDING') {
              <button class="action-btn done-btn" (click)="toggle('DONE')" title="Done">✓</button>
              <button class="action-btn skip-btn" (click)="toggle('SKIPPED')" title="Skip">✕</button>
            } @else {
              <span class="status-badge" [ngClass]="item.status.toLowerCase()">{{ item.status === 'DONE' ? '✓' : '⏭' }}</span>
            }
          </div>
        </div>
      }

      <!-- Child item: simple checklist row -->
      @if (isChild) {
        <div class="item-row child-row">
          <button class="check-btn" (click)="toggle(item.status === 'DONE' ? 'PENDING' : 'DONE')">
            {{ item.status === 'DONE' ? '☑' : '☐' }}
          </button>
          <span class="item-title" [ngClass]="{ crossed: item.status === 'DONE' }">
            {{ item.title }}
          </span>
        </div>
      }

      <!-- Recursive children -->
      @if (item.children && item.children.length > 0) {
        <div class="children-list">
          @for (child of item.children; track child.id) {
            <app-plan-item-tree
              [item]="child"
              [isChild]="true"
              (statusChanged)="onChildStatusChanged($event)" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .plan-item {
      margin-bottom: 2px;
    }

    .item-row {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border-radius: 10px;
      transition: background 0.2s, opacity 0.3s;
    }

    .parent-row {
      background: var(--bg2);
      border-left: 3px solid var(--accent);

      &:hover { background: var(--bg3); }
    }

    .parent-row.done, .parent-row.skipped {
      opacity: 0.5;
      border-left-color: var(--muted);
    }

    .child-row {
      padding: 6px 12px 6px 24px;
      font-size: 0.9rem;
    }

    .item-time {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--accent);
      min-width: 42px;
      font-variant-numeric: tabular-nums;
    }

    .category-badge {
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      background: var(--bg3);
      color: var(--muted);

      &.meal, &.meal_prep { color: var(--gold); background: rgba(255, 179, 71, 0.15); }
      &.exercise { color: var(--accent); background: rgba(94, 207, 255, 0.15); }
      &.shopping { color: var(--purple); background: rgba(167, 139, 250, 0.15); }
      &.hydration { color: #4fc3f7; background: rgba(79, 195, 247, 0.1); }
      &.self_care { color: var(--rose); background: rgba(251, 113, 133, 0.15); }
      &.work { color: var(--muted); }
      &.chore { color: var(--muted); }
    }

    .item-title {
      flex: 1;
      color: var(--text);
      font-size: 0.95rem;
    }

    .crossed {
      text-decoration: line-through;
      color: var(--muted);
    }

    .duration {
      font-size: 0.75rem;
      color: var(--muted);
    }

    .item-actions {
      display: flex;
      gap: 6px;
    }

    .action-btn {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      border: 1px solid var(--border);
      background: transparent;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;
    }

    .done-btn {
      color: var(--success);
      &:hover { background: var(--success); color: white; border-color: var(--success); }
    }

    .skip-btn {
      color: var(--muted);
      &:hover { background: var(--danger); color: white; border-color: var(--danger); }
    }

    .status-badge {
      font-size: 0.8rem;
      padding: 2px 8px;
      border-radius: 8px;

      &.done { color: var(--success); }
      &.skipped { color: var(--muted); }
    }

    .check-btn {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 18px;
      padding: 0;
      line-height: 1;
      color: var(--text);
    }

    .children-list {
      margin-left: 16px;
      border-left: 1px dashed var(--border);
      padding-left: 4px;
    }
  `]
})
export class PlanItemTreeComponent {
  @Input({ required: true }) item!: PlanItemNode;
  @Input() isChild = false;
  @Output() statusChanged = new EventEmitter<PlanItemEvent>();

  toggle(newStatus: string) {
    this.statusChanged.emit({
      itemId: this.item.id,
      status: newStatus,
      isChild: this.isChild,
    });
  }

  onChildStatusChanged(event: PlanItemEvent) {
    this.statusChanged.emit(event);
  }

  categoryIcon(category: string): string {
    const icons: Record<string, string> = {
      MEAL: '🍽', MEAL_PREP: '🔪', EXERCISE: '💪',
      WORK: '💼', HYDRATION: '💧', CHORE: '🧹',
      SELF_CARE: '🧘', SHOPPING: '🛒', OTHER: '📌',
    };
    return icons[category] || category;
  }
}
