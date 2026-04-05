import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ThemeService } from './shared/services/theme.service';
import { NotificationPollingService } from './shared/services/notification-polling.service';
import { NotificationToastComponent } from './shared/components/notification-toast/notification-toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NotificationToastComponent],
  template: `
    <router-outlet />
    <app-notification-toast />
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AppComponent implements OnInit {
  private readonly themeService = inject(ThemeService);
  private readonly notificationPolling = inject(NotificationPollingService);

  ngOnInit(): void {
    this.themeService.init();
    this.notificationPolling.start(60_000); // poll every 60s
  }
}
