import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';
import { SoundService } from '../../shared/services/sound.service';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-ai-reminders-page',
  standalone: true,
  imports: [NavBarComponent, FormsModule, DatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-reminders-page.component.html',
  styleUrl: './ai-reminders-page.component.scss',
})
export class AiRemindersPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly sound = inject(SoundService);
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
      next: () => { this.sound.play('confirm'); this.showForm.set(false); this.newTitle = ''; this.newBody = ''; this.newDateTime = ''; this.loadReminders(); },
    });
  }

  complete(id: string) {
    this.api.completeReminder(id).subscribe({ next: () => { this.sound.play('complete'); this.loadReminders(); } });
  }

  snooze(id: string) {
    this.api.snoozeReminder(id, 30).subscribe({ next: () => this.loadReminders() });
  }

  deleteReminder(id: string) {
    this.api.deleteReminder(id).subscribe({ next: () => this.loadReminders() });
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', nutrition: '/nutrition', profile: '/profile', monitor: '/monitor' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
