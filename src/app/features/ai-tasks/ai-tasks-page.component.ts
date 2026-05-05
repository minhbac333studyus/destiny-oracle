import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';
import { SoundService } from '../../shared/services/sound.service';
import { DailyPlanSectionComponent } from './components/daily-plan-section/daily-plan-section.component';
import { ScheduleTemplateFormComponent } from './components/schedule-template-form/schedule-template-form.component';

@Component({
  selector: 'app-ai-tasks-page',
  standalone: true,
  imports: [NavBarComponent, DailyPlanSectionComponent, ScheduleTemplateFormComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-tasks-page.component.html',
  styleUrl: './ai-tasks-page.component.scss',
})
export class AiTasksPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly sound = inject(SoundService);
  readonly router = inject(Router);

  tasks = signal<any[]>([]);
  reminders = signal<any[]>([]);
  loading = signal(false);
  tab = signal<'active' | 'completed'>('active');

  // Daily Plan
  todayPlan = signal<any | null>(null);
  showTemplateForm = signal(false);

  ngOnInit() {
    this.loadTasks();
    this.loadReminders();
    this.loadTodayPlan();
  }

  // ── Daily Plan ──────────────────────────────────────────────

  loadTodayPlan() {
    this.api.getTodayPlan().subscribe({
      next: (plan) => this.todayPlan.set(plan || null),
      error: () => this.todayPlan.set(null),
    });
  }

  generatePlan() {
    this.router.navigate(['/chat'], { queryParams: { action: 'daily-plan' } });
  }

  onPlanUpdated() {
    this.loadTodayPlan();
  }

  onResetPlan() {
    const plan = this.todayPlan();
    if (!plan?.id) return;
    this.api.deleteDailyPlan(plan.id).subscribe({
      next: () => {
        this.todayPlan.set(null);
        this.sound.play('confirm');
      },
    });
  }

  // ── Tasks ───────────────────────────────────────────────────

  loadTasks() {
    this.loading.set(true);
    const obs = this.tab() === 'active' ? this.api.getActiveTasks() : this.api.getCompletedTasks();
    obs.subscribe({
      next: (tasks) => { this.tasks.set(tasks || []); this.loading.set(false); },
      error: () => { this.tasks.set([]); this.loading.set(false); },
    });
  }

  toggleStep(stepId: string) {
    this.api.toggleTaskStep(stepId).subscribe({
      next: (updatedTask) => {
        this.sound.play('complete');
        this.tasks.update(tasks => tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      },
    });
  }

  // ── Reminders ───────────────────────────────────────────────

  loadReminders() {
    this.api.getReminders().subscribe({
      next: (r) => this.reminders.set(r || []),
      error: () => this.reminders.set([]),
    });
  }

  dismissingId = signal<string | null>(null);

  completeReminder(id: string) {
    this.api.completeReminder(id).subscribe({
      next: () => {
        this.sound.play('complete');
        this.reminders.update(r => r.map(x => x.id === id ? { ...x, completed: true } : x));
      },
    });
  }

  deleteReminder(id: string) {
    this.dismissingId.set(id);
    this.api.deleteReminder(id).subscribe({
      next: () => setTimeout(() => this.reminders.update(r => r.filter(x => x.id !== id)), 600),
      error: () => this.dismissingId.set(null),
    });
  }

  isPast(dateStr: string): boolean {
    return new Date(dateStr) < new Date();
  }

  formatTime(dateStr: string): string {
    const d = new Date(dateStr);
    const now = new Date();
    const isToday = d.toDateString() === now.toDateString();
    const time = d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
    return isToday ? time : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ' + time;
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', nutrition: '/nutrition', profile: '/profile', monitor: '/monitor' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
