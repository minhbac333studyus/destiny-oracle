import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';

@Component({
  selector: 'app-reflection-chamber-page',
  standalone: true,
  imports: [NavBarComponent, OracleButtonComponent],
  templateUrl: './reflection-chamber-page.component.html',
  styleUrl: './reflection-chamber-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReflectionChamberPageComponent {
  readonly #router = inject(Router);

  onTab(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', nutrition: '/nutrition', profile: '/profile', monitor: '/monitor',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }
}
