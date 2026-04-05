import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { ApiService } from './api.service';
import { SoundService } from './sound.service';

export interface InAppNotification {
  id: string;
  title: string;
  description?: string;
  category?: string;
  scheduledTime?: string;
  type: 'plan_reminder' | 'reminder';
}

@Injectable({ providedIn: 'root' })
export class NotificationPollingService implements OnDestroy {
  private readonly api = inject(ApiService);
  private readonly sound = inject(SoundService);
  private intervalId: any = null;
  private notifiedIds = new Set<string>();

  readonly activeNotifications = signal<InAppNotification[]>([]);

  start(intervalMs = 60_000): void {
    if (this.intervalId) return; // already running
    this.check(); // check immediately
    this.intervalId = setInterval(() => this.check(), intervalMs);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  dismiss(id: string): void {
    this.activeNotifications.update(list => list.filter(n => n.id !== id));
  }

  ngOnDestroy(): void {
    this.stop();
  }

  private check(): void {
    // Check reminders
    this.api.getReminders().subscribe({
      next: (reminders) => {
        const now = new Date();
        const due = (reminders || []).filter((r: any) => {
          if (r.completed || r.notificationSent) return false;
          const scheduled = new Date(r.scheduledAt);
          return scheduled <= now && !this.notifiedIds.has(r.id);
        });

        if (due.length > 0) {
          const newNotifications: InAppNotification[] = due.map((r: any) => ({
            id: r.id,
            title: r.title,
            description: r.body,
            type: 'reminder' as const,
          }));

          this.activeNotifications.update(list => [...list, ...newNotifications]);
          due.forEach((r: any) => this.notifiedIds.add(r.id));
          this.sound.play('notification');
        }
      },
    });

    // Check today's plan items with due reminders
    this.api.getTodayPlan().subscribe({
      next: (plan) => {
        if (!plan?.items) return;
        const now = new Date();
        const nowTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const dueItems = plan.items.filter((item: any) => {
          if (item.status !== 'PENDING' || !item.reminderTime || item.reminderDismissed) return false;
          return item.reminderTime <= nowTime && !this.notifiedIds.has('plan_' + item.id);
        });

        if (dueItems.length > 0) {
          const newNotifications: InAppNotification[] = dueItems.map((item: any) => ({
            id: 'plan_' + item.id,
            title: item.title,
            description: item.description,
            category: item.category,
            scheduledTime: item.scheduledTime,
            type: 'plan_reminder' as const,
          }));

          this.activeNotifications.update(list => [...list, ...newNotifications]);
          dueItems.forEach((item: any) => this.notifiedIds.add('plan_' + item.id));
          this.sound.play('notification');
        }
      },
    });
  }
}
