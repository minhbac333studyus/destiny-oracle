import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
  inject,
} from '@angular/core';
import { NgClass } from '@angular/common';
import { ThemeService } from '../../services/theme.service';
import { SoundService } from '../../services/sound.service';
import { AuthService } from '../../services/auth.service';

export type NavTab = 'today' | 'spread' | 'chat' | 'tasks' | 'nutrition' | 'profile' | 'monitor';

@Component({
  selector: 'app-nav-bar',
  standalone: true,
  imports: [NgClass],
  templateUrl: './nav-bar.component.html',
  styleUrl: './nav-bar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NavBarComponent {
  @Input({ required: true }) activeTab!: NavTab;
  @Input() streakDays = 0;
  @Output() tabChanged = new EventEmitter<NavTab>();

  readonly themeService = inject(ThemeService);
  readonly soundService = inject(SoundService);
  private readonly auth = inject(AuthService);

  private readonly allTabs: { id: NavTab; label: string }[] = [
    { id: 'spread',  label: 'Cards'   },
    { id: 'chat',    label: 'Chat'    },
    { id: 'tasks',   label: 'Tasks'   },
{ id: 'nutrition', label: 'Nutrition' },
    { id: 'profile',   label: 'Profile'   },
    { id: 'monitor', label: 'Admin'   },
  ];

  readonly tabs = this.auth.isAdmin()
    ? this.allTabs
    : this.allTabs.filter(t => t.id !== 'monitor');

  select(tab: NavTab): void {
    this.tabChanged.emit(tab);
  }
}
