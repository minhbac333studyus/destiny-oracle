import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass, DatePipe } from '@angular/common';
import { GoalsStore } from './goals.store';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';

@Component({
  selector: 'app-goals-page',
  standalone: true,
  imports: [NgClass, DatePipe, NavBarComponent, OracleButtonComponent, AspectIconPipe],
  templateUrl: './goals-page.component.html',
  styleUrl: './goals-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [GoalsStore],
})
export class GoalsPageComponent {
  readonly store   = inject(GoalsStore);
  readonly #router = inject(Router);

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', goals: '/goals', profile: '/profile',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }
}
