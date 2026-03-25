import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-ai-plans-page',
  standalone: true,
  imports: [NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="plans-page">
      <app-nav-bar activeTab="goals" (tabChanged)="onTabChanged($event)" />

      <div class="container">
        <h2>Saved Plans</h2>

        @if (loading()) {
          <div class="loading">Loading plans...</div>
        }

        @if (!loading() && plans().length === 0) {
          <div class="empty">
            <div class="empty-icon">📝</div>
            <p>No saved plans yet.</p>
            <p class="hint">Chat with AI to create workout, meal, or routine plans, then save them!</p>
            <button class="go-chat" (click)="router.navigate(['/chat'])">💬 Create via Chat</button>
          </div>
        }

        <div class="plan-grid">
          @for (plan of plans(); track plan.id) {
            <div class="plan-card" (click)="selectPlan(plan)">
              <div class="plan-type">{{ plan.type }}</div>
              <h3>{{ plan.name }}</h3>
              @if (plan.description) {
                <p class="plan-desc">{{ plan.description }}</p>
              }
              <div class="plan-meta">
                <span>v{{ plan.version }}</span>
                @if (plan.schedules?.length) {
                  <span>📅 {{ plan.schedules.length }} schedule(s)</span>
                }
              </div>
            </div>
          }
        </div>

        @if (selectedPlan()) {
          <div class="plan-detail-overlay" (click)="selectedPlan.set(null)">
            <div class="plan-detail" (click)="$event.stopPropagation()">
              <div class="detail-header">
                <h2>{{ selectedPlan()!.name }}</h2>
                <button class="close-btn" (click)="selectedPlan.set(null)">✕</button>
              </div>
              <div class="detail-type">{{ selectedPlan()!.type }} · Version {{ selectedPlan()!.version }}</div>
              @if (selectedPlan()!.description) {
                <p class="detail-desc">{{ selectedPlan()!.description }}</p>
              }
              <div class="detail-content">
                <h4>Plan Content</h4>
                <pre class="content-json">{{ formatContent(selectedPlan()!.content) }}</pre>
              </div>
              <div class="detail-actions">
                <button class="delete-btn" (click)="deletePlan(selectedPlan()!.id)">🗑 Delete</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .plans-page { min-height: 100vh; background: #0c1028; }
    .container { max-width: 700px; margin: 0 auto; padding: 16px; }
    h2 { color: #f5f0ff; margin: 0 0 20px; }
    .loading, .empty { text-align: center; color: #9ca3af; padding: 48px 16px; }
    .empty-icon { font-size: 2.5rem; }
    .hint { font-size: 0.85rem; }
    .go-chat { margin-top: 12px; background: rgba(94,207,255,0.15); border: 1px solid rgba(94,207,255,0.3); color: #5ecfff; padding: 8px 20px; border-radius: 20px; cursor: pointer; }

    .plan-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; }
    .plan-card {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 16px; cursor: pointer; transition: all 0.2s;
      &:hover { border-color: rgba(94,207,255,0.3); background: rgba(255,255,255,0.06); }
    }
    .plan-type { font-size: 0.7rem; color: #a855f7; text-transform: uppercase; letter-spacing: 0.05em; }
    .plan-card h3 { color: #f5f0ff; margin: 6px 0; font-size: 1rem; }
    .plan-desc { color: #9ca3af; font-size: 0.85rem; margin: 4px 0; }
    .plan-meta { display: flex; gap: 12px; font-size: 0.75rem; color: #6b7280; margin-top: 8px; }

    .plan-detail-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 100; padding: 16px; }
    .plan-detail { background: #141838; border: 1px solid rgba(255,255,255,0.1); border-radius: 16px; padding: 24px; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto; }
    .detail-header { display: flex; justify-content: space-between; align-items: center; }
    .detail-header h2 { margin: 0; color: #f5f0ff; }
    .close-btn { background: none; border: none; color: #9ca3af; font-size: 1.2rem; cursor: pointer; }
    .detail-type { color: #a855f7; font-size: 0.8rem; margin-top: 4px; }
    .detail-desc { color: #d1d5db; margin: 12px 0; }
    .detail-content h4 { color: #f5f0ff; margin: 16px 0 8px; }
    .content-json { background: rgba(0,0,0,0.3); border-radius: 8px; padding: 12px; color: #5ecfff; font-size: 0.8rem; overflow-x: auto; white-space: pre-wrap; word-break: break-all; }
    .detail-actions { margin-top: 16px; display: flex; gap: 8px; }
    .delete-btn { background: rgba(239,68,68,0.15); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; padding: 6px 16px; border-radius: 8px; cursor: pointer; }
  `],
})
export class AiPlansPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  readonly router = inject(Router);

  plans = signal<any[]>([]);
  loading = signal(false);
  selectedPlan = signal<any | null>(null);

  ngOnInit() { this.loadPlans(); }

  loadPlans() {
    this.loading.set(true);
    this.api.getPlans().subscribe({
      next: (plans) => { this.plans.set(plans || []); this.loading.set(false); },
      error: () => { this.plans.set([]); this.loading.set(false); },
    });
  }

  selectPlan(plan: any) { this.selectedPlan.set(plan); }

  deletePlan(id: string) {
    this.api.deletePlan(id).subscribe({
      next: () => { this.selectedPlan.set(null); this.loadPlans(); },
    });
  }

  formatContent(content: string): string {
    try { return JSON.stringify(JSON.parse(content), null, 2); }
    catch { return content; }
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', goals: '/goals', profile: '/profile' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
