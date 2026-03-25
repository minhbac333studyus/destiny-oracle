import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';

@Component({
  selector: 'app-reflection-chamber-page',
  standalone: true,
  imports: [NavBarComponent, OracleButtonComponent],
  template: `
    <app-nav-bar activeTab="profile" (tabChanged)="onTab($event)" />
    <div class="chamber-wrap">
      <div class="chamber-icon">🌌</div>
      <h1 class="chamber-title">THE REFLECTION CHAMBER</h1>
      <p class="chamber-sub">
        This sacred space unlocks on Day 365.<br>
        Return when a year of effort has passed.
      </p>
      <app-oracle-button variant="ghost" (click)="onTab('spread')">Back to Spread</app-oracle-button>
    </div>
  `,
  styleUrl: './reflection-chamber-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReflectionChamberPageComponent {
  readonly #router = inject(Router);

  onTab(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', goals: '/goals', profile: '/profile',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }
}
