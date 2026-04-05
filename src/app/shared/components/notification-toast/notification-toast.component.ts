import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { NotificationPollingService, InAppNotification } from '../../services/notification-polling.service';

@Component({
  selector: 'app-notification-toast',
  standalone: true,
  imports: [NgClass],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (notification of polling.activeNotifications(); track notification.id) {
      <div class="toast" [ngClass]="notification.type" @slideIn>
        <div class="toast-icon">
          {{ notification.type === 'plan_reminder' ? '🗓️' : '⏰' }}
        </div>
        <div class="toast-content">
          <span class="toast-title">{{ notification.title }}</span>
          @if (notification.scheduledTime) {
            <span class="toast-time">{{ notification.scheduledTime }}</span>
          }
          @if (notification.description) {
            <span class="toast-desc">{{ notification.description }}</span>
          }
        </div>
        <div class="toast-actions">
          <button class="toast-btn go-btn" (click)="goToTasks(notification)">Go</button>
          <button class="toast-btn dismiss-btn" (click)="dismiss(notification)">✕</button>
        </div>
      </div>
    }
  `,
  styles: [`
    :host {
      position: fixed;
      top: 70px;
      right: 16px;
      z-index: 200;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 360px;
      width: 100%;
      pointer-events: none;
    }

    .toast {
      pointer-events: all;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 14px;
      background: var(--bg2);
      border: 1px solid var(--border);
      border-radius: 12px;
      box-shadow: var(--shadow-lg);
      backdrop-filter: blur(12px);
      animation: slideIn 0.3s ease-out;

      &.plan_reminder { border-left: 3px solid var(--accent); }
      &.reminder { border-left: 3px solid var(--gold); }
    }

    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }

    .toast-icon { font-size: 1.5rem; flex-shrink: 0; }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 2px;
      min-width: 0;
    }

    .toast-title {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toast-time {
      font-size: 0.75rem;
      color: var(--accent);
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }

    .toast-desc {
      font-size: 0.78rem;
      color: var(--muted);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .toast-actions {
      display: flex;
      gap: 6px;
      flex-shrink: 0;
    }

    .toast-btn {
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 0.75rem;
      cursor: pointer;
      transition: all 0.15s;
      background: transparent;
    }

    .go-btn {
      color: var(--accent);
      &:hover { background: var(--accent); color: white; border-color: var(--accent); }
    }

    .dismiss-btn {
      color: var(--muted);
      &:hover { background: var(--bg3); }
    }
  `]
})
export class NotificationToastComponent {
  readonly polling = inject(NotificationPollingService);
  private readonly router = inject(Router);

  dismiss(notification: InAppNotification): void {
    this.polling.dismiss(notification.id);
  }

  goToTasks(notification: InAppNotification): void {
    this.polling.dismiss(notification.id);
    this.router.navigate(['/tasks']);
  }
}
