import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-ai-tasks-page',
  standalone: true,
  imports: [NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tasks-page">
      <app-nav-bar activeTab="tasks" (tabChanged)="onTabChanged($event)" />

      <div class="container">
        <div class="page-header">
          <h2>Tasks</h2>
          <div class="tab-toggle">
            <button [class.active]="tab() === 'active'" (click)="tab.set('active'); loadTasks()">Active</button>
            <button [class.active]="tab() === 'completed'" (click)="tab.set('completed'); loadTasks()">Done</button>
          </div>
        </div>

        @if (loading()) {
          <div class="loading">Loading tasks...</div>
        }

        @if (!loading() && tasks().length === 0) {
          <div class="empty">
            <div class="empty-icon">📋</div>
            <p>No {{ tab() }} tasks yet.</p>
            <p class="hint">Ask the AI to create a workout plan or task list!</p>
            <button class="go-chat" (click)="router.navigate(['/chat'])">💬 Open Chat</button>
          </div>
        }

        <div class="task-list">
          @for (task of tasks(); track task.id) {
            <div class="task-card">
              <div class="task-header">
                <div>
                  <span class="task-category">{{ task.category }}</span>
                  <h3 class="task-name">{{ task.name }}</h3>
                </div>
                <div class="task-progress">
                  <span class="progress-text">{{ task.completedSteps }}/{{ task.totalSteps }}</span>
                  <div class="progress-bar">
                    <div class="progress-fill" [style.width.%]="(task.completedSteps / task.totalSteps) * 100"></div>
                  </div>
                </div>
              </div>

              <div class="steps">
                @for (step of task.steps; track step.id) {
                  <button class="step" [class.done]="step.completed" (click)="toggleStep(step.id)">
                    <span class="check">{{ step.completed ? '✅' : '⬜' }}</span>
                    <span class="step-title">{{ step.title }}</span>
                    @if (task.xpPerStep && !step.completed) {
                      <span class="xp-badge">+{{ task.xpPerStep }} XP</span>
                    }
                  </button>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .tasks-page { min-height: 100vh; background: #0c1028; }
    .container { max-width: 700px; margin: 0 auto; padding: 16px; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
    .page-header h2 { color: #f5f0ff; margin: 0; }
    .tab-toggle { display: flex; gap: 4px; background: rgba(255,255,255,0.05); border-radius: 8px; padding: 2px; }
    .tab-toggle button {
      border: none; background: transparent; color: #9ca3af; padding: 6px 14px;
      border-radius: 6px; cursor: pointer; font-size: 0.85rem;
      &.active { background: rgba(94, 207, 255, 0.15); color: #5ecfff; }
    }
    .loading, .empty { text-align: center; color: #9ca3af; padding: 48px 16px; }
    .empty-icon { font-size: 2.5rem; margin-bottom: 8px; }
    .hint { font-size: 0.85rem; margin-top: 4px; }
    .go-chat { margin-top: 12px; background: rgba(94,207,255,0.15); border: 1px solid rgba(94,207,255,0.3); color: #5ecfff; padding: 8px 20px; border-radius: 20px; cursor: pointer; }

    .task-list { display: flex; flex-direction: column; gap: 16px; }
    .task-card { background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08); border-radius: 12px; padding: 16px; }
    .task-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; }
    .task-category { font-size: 0.7rem; color: #a855f7; text-transform: uppercase; letter-spacing: 0.05em; }
    .task-name { color: #f5f0ff; margin: 4px 0 0; font-size: 1rem; }
    .task-progress { text-align: right; }
    .progress-text { color: #5ecfff; font-size: 0.85rem; font-weight: 600; }
    .progress-bar { width: 80px; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; margin-top: 4px; }
    .progress-fill { height: 100%; background: linear-gradient(90deg, #5ecfff, #a855f7); border-radius: 2px; transition: width 0.3s; }

    .steps { display: flex; flex-direction: column; gap: 4px; }
    .step {
      display: flex; align-items: center; gap: 10px; background: transparent; border: none;
      color: #d1d5db; padding: 8px; border-radius: 8px; cursor: pointer; text-align: left; width: 100%;
      transition: background 0.15s;
      &:hover { background: rgba(255,255,255,0.04); }
      &.done { opacity: 0.6; }
      &.done .step-title { text-decoration: line-through; }
    }
    .check { font-size: 1.1rem; }
    .step-title { flex: 1; font-size: 0.9rem; }
    .xp-badge { font-size: 0.7rem; color: #ffb347; background: rgba(255,179,71,0.12); padding: 2px 8px; border-radius: 10px; }
  `],
})
export class AiTasksPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly router = inject(Router);

  tasks = signal<any[]>([]);
  loading = signal(false);
  tab = signal<'active' | 'completed'>('active');

  ngOnInit() { this.loadTasks(); }

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
        this.tasks.update(tasks => tasks.map(t => t.id === updatedTask.id ? updatedTask : t));
      },
    });
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', goals: '/goals', profile: '/profile' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
