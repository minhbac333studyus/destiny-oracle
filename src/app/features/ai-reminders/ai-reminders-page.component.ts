import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ai-reminders-page',
  standalone: true,
  imports: [NavBarComponent, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="reminders-page">
      <app-nav-bar activeTab="tasks" (tabChanged)="onTabChanged($event)" />

      <div class="container">
        <div class="page-header">
          <h2>Reminders</h2>
          <button class="add-btn" (click)="showForm.set(!showForm())">{{ showForm() ? '✕' : '+ New' }}</button>
        </div>

        @if (showForm()) {
          <div class="new-form">
            <input type="text" [(ngModel)]="newTitle" placeholder="Reminder title..." class="form-input" />
            <input type="text" [(ngModel)]="newBody" placeholder="Details (optional)" class="form-input" />
            <input type="datetime-local" [(ngModel)]="newDateTime" class="form-input" />
            <select [(ngModel)]="newRepeat" class="form-input">
              <option value="NONE">No repeat</option>
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
            <button class="create-btn" (click)="createReminder()" [disabled]="!newTitle.trim() || !newDateTime">Create Reminder</button>
          </div>
        }

        @if (loading()) {
          <div class="loading">Loading reminders...</div>
        }

        @if (!loading() && reminders().length === 0) {
          <div class="empty">
            <div class="empty-icon">🔔</div>
            <p>No active reminders.</p>
            <p class="hint">Create one above or ask AI in chat!</p>
          </div>
        }

        <div class="reminder-list">
          @for (r of reminders(); track r.id) {
            <div class="reminder-card" [class.sent]="r.notificationSent">
              <div class="reminder-main">
                <div class="reminder-info">
                  <h4>{{ r.title }}</h4>
                  @if (r.body) { <p class="reminder-body">{{ r.body }}</p> }
                  <div class="reminder-meta">
                    <span>📅 {{ r.scheduledAt | date:'MMM d, h:mm a' }}</span>
                    @if (r.repeatType !== 'NONE') { <span class="repeat-badge">🔁 {{ r.repeatType }}</span> }
                  </div>
                </div>
                <div class="reminder-actions">
                  @if (!r.completed) {
                    <button class="action-btn done" (click)="complete(r.id)" title="Mark done">✅</button>
                    <button class="action-btn snooze" (click)="snooze(r.id)" title="Snooze 30min">💤</button>
                  } @else {
                    <span class="completed-badge">Done ✓</span>
                  }
                  <button class="action-btn delete" (click)="deleteReminder(r.id)" title="Delete">🗑</button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .reminders-page { min-height: 100vh; background: #0c1028; }
    .container { max-width: 700px; margin: 0 auto; padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-header h2 { color: #f5f0ff; margin: 0; }
    .add-btn { background: rgba(94,207,255,0.15); border: 1px solid rgba(94,207,255,0.3); color: #5ecfff; padding: 6px 16px; border-radius: 8px; cursor: pointer; }

    .new-form { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 16px; margin-bottom: 16px; display: flex; flex-direction: column; gap: 10px; }
    .form-input { background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; padding: 10px 12px; color: #f5f0ff; font-size: 0.9rem; outline: none; }
    .form-input:focus { border-color: rgba(94,207,255,0.4); }
    .create-btn { background: linear-gradient(135deg, #5ecfff, #a855f7); border: none; color: white; padding: 10px; border-radius: 8px; cursor: pointer; font-weight: 600; &:disabled { opacity: 0.5; } }

    .loading, .empty { text-align: center; color: #9ca3af; padding: 48px 16px; }
    .empty-icon { font-size: 2.5rem; }
    .hint { font-size: 0.85rem; }

    .reminder-list { display: flex; flex-direction: column; gap: 10px; }
    .reminder-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 14px; &.sent { border-left: 3px solid #ffb347; } }
    .reminder-main { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
    .reminder-info { flex: 1; }
    .reminder-info h4 { color: #f5f0ff; margin: 0; font-size: 0.95rem; }
    .reminder-body { color: #9ca3af; font-size: 0.85rem; margin: 4px 0 0; }
    .reminder-meta { display: flex; gap: 10px; font-size: 0.75rem; color: #6b7280; margin-top: 6px; }
    .repeat-badge { color: #a855f7; }
    .reminder-actions { display: flex; gap: 6px; flex-shrink: 0; }
    .action-btn { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 4px; border-radius: 6px; transition: background 0.15s; &:hover { background: rgba(255,255,255,0.06); } }
    .completed-badge { color: #22c55e; font-size: 0.8rem; }
  `],
})
export class AiRemindersPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  reminders = signal<any[]>([]);
  loading = signal(false);
  showForm = signal(false);
  newTitle = '';
  newBody = '';
  newDateTime = '';
  newRepeat = 'NONE';

  ngOnInit() { this.loadReminders(); }

  loadReminders() {
    this.loading.set(true);
    this.api.getReminders().subscribe({
      next: (r) => { this.reminders.set(r || []); this.loading.set(false); },
      error: () => { this.reminders.set([]); this.loading.set(false); },
    });
  }

  createReminder() {
    if (!this.newTitle.trim() || !this.newDateTime) return;
    this.api.createReminder({
      title: this.newTitle.trim(),
      body: this.newBody.trim() || null,
      scheduledAt: this.newDateTime,
      repeatType: this.newRepeat,
    }).subscribe({
      next: () => { this.showForm.set(false); this.newTitle = ''; this.newBody = ''; this.newDateTime = ''; this.loadReminders(); },
    });
  }

  complete(id: string) {
    this.api.completeReminder(id).subscribe({ next: () => this.loadReminders() });
  }

  snooze(id: string) {
    this.api.snoozeReminder(id, 30).subscribe({ next: () => this.loadReminders() });
  }

  deleteReminder(id: string) {
    this.api.deleteReminder(id).subscribe({ next: () => this.loadReminders() });
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', goals: '/goals', profile: '/profile' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
