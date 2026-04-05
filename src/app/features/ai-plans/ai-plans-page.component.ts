import { ChangeDetectionStrategy, Component, inject, signal, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';

@Component({
  selector: 'app-ai-plans-page',
  standalone: true,
  imports: [NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './ai-plans-page.component.html',
  styleUrl: './ai-plans-page.component.scss',
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
    const routes: Record<string, string> = { spread: '/spread', chat: '/chat', tasks: '/tasks', nutrition: '/nutrition', profile: '/profile', monitor: '/monitor' };
    this.router.navigate([routes[tab] || '/spread']);
  }
}
