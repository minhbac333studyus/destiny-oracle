import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder } from '@angular/forms';
import { DatePipe } from '@angular/common';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [ReactiveFormsModule, DatePipe, NavBarComponent, OracleButtonComponent],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProfilePageComponent {
  readonly #fb          = inject(FormBuilder);
  readonly #auth        = inject(AuthService);
  readonly #router      = inject(Router);

  readonly user = this.#auth.user;

  form = this.#fb.group({
    displayName:          [this.user()?.displayName ?? ''],
    email:                [this.user()?.email ?? ''],
    notificationsEnabled: [true],
    dailyReminderTime:    ['08:00'],
  });

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today: '/checkin', spread: '/spread', nutrition: '/nutrition', profile: '/profile', monitor: '/monitor', chat: '/chat'
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }

  onSave(): void {
    this.#router.navigate(['/spread']);
  }

  onLogout(): void {
    this.#auth.logout();
  }
}
