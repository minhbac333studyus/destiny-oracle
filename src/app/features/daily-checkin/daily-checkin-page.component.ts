import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { NgClass } from '@angular/common';
import { DailyCheckinStore } from './daily-checkin.store';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { LoadingOracleComponent } from '../../shared/components/loading-oracle/loading-oracle.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { AspectIconPipe } from '../../shared/pipes/aspect-icon.pipe';

@Component({
  selector: 'app-daily-checkin-page',
  standalone: true,
  imports: [NgClass, NavBarComponent, LoadingOracleComponent, OracleButtonComponent, AspectIconPipe],
  templateUrl: './daily-checkin-page.component.html',
  styleUrl: './daily-checkin-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [DailyCheckinStore],
})
export class DailyCheckinPageComponent implements OnInit {
  readonly store   = inject(DailyCheckinStore);
  readonly #router = inject(Router);

  ngOnInit(): void { this.store.load(); }

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', goals: '/goals', profile: '/profile',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }

  onDone(): void { this.#router.navigate(['/spread']); }
}
