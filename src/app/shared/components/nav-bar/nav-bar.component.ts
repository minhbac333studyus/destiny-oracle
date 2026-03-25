import {
  ChangeDetectionStrategy,
  Component,
  Input,
  Output,
  EventEmitter,
} from '@angular/core';
import { NgClass } from '@angular/common';

export type NavTab = 'today' | 'spread' | 'goals' | 'profile';

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

  readonly tabs: { id: NavTab; label: string }[] = [
    { id: 'today',   label: 'Today'   },
    { id: 'spread',  label: 'Spread'  },
    { id: 'goals',   label: 'Goals'   },
    { id: 'profile', label: 'Profile' },
  ];

  select(tab: NavTab): void {
    this.tabChanged.emit(tab);
  }
}
