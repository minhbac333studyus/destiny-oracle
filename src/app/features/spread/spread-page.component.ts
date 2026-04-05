import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  inject,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { SpreadStore } from './spread.store';
import { SpreadGridComponent } from './spread-grid.component';
import { NavBarComponent } from '../../shared/components/nav-bar/nav-bar.component';
import { OracleButtonComponent } from '../../shared/components/oracle-button/oracle-button.component';
import { QuickInputComponent } from '../../shared/components/quick-input/quick-input.component';
import { GenerationProgressComponent } from '../../shared/components/generation-progress/generation-progress.component';
import { ApiService } from '../../shared/services/api.service';

const ICON_OPTIONS = ['🎯','🌊','🔥','🌿','⚡','🎨','🧠','🏆','💫','🌙','🦋','⚔️'];

@Component({
  selector: 'app-spread-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    SpreadGridComponent,
    NavBarComponent,
    OracleButtonComponent,
    QuickInputComponent,
    GenerationProgressComponent,
  ],
  templateUrl: './spread-page.component.html',
  styleUrl: './spread-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SpreadPageComponent implements OnInit {
  readonly store   = inject(SpreadStore);
  readonly #router = inject(Router);
  readonly #api    = inject(ApiService);
  readonly #fb     = inject(FormBuilder);

  // ── Add-card inline form ──────────────────────────────
  readonly showAddForm  = signal(false);
  readonly selectedIcon = signal('🎯');
  readonly submitting   = signal(false);
  readonly iconOptions  = ICON_OPTIONS;

  addForm = this.#fb.group({
    label:    ['', [Validators.required, Validators.minLength(2)]],
    fearText: ['', [Validators.required, Validators.minLength(20)]],
  });

  get labelCtrl()  { return this.addForm.get('label')!;    }
  get fearCtrl()   { return this.addForm.get('fearText')!; }

  selectIcon(icon: string): void { this.selectedIcon.set(icon); }

  onAddCard(): void {
    this.showAddForm.set(true);
    this.addForm.reset();
    this.selectedIcon.set('🎯');
  }

  onCancelAdd(): void {
    this.showAddForm.set(false);
    this.submitting.set(false);
  }

  onSubmitCard(): void {
    if (this.addForm.invalid) { this.addForm.markAllAsTouched(); return; }
    this.submitting.set(true);
    const { label, fearText } = this.addForm.getRawValue();
    this.#api.addCard({
      aspectLabel: label!,
      fearText:    fearText!,
      dreamText:   '',
      icon:        this.selectedIcon(),
    }).subscribe({
      next: card => {
        this.showAddForm.set(false);
        this.submitting.set(false);
        this.generatingCardId.set(card.id);
        this.generatingCardLabel.set(label!);
        this.store.load(); // show the new card in the grid immediately
      },
      error: () => this.submitting.set(false),
    });
  }

  // ── Generation progress ───────────────────────────────
  readonly generatingCardId    = signal<string | null>(null);
  readonly generatingCardLabel = signal<string>('');

  ngOnInit(): void {
    this.store.load();

    // Pick up state passed if navigated here after card creation
    const nav = this.#router.getCurrentNavigation();
    const state = nav?.extras?.state ?? history.state;
    if (state?.['generatingCardId']) {
      this.generatingCardId.set(state['generatingCardId']);
      this.generatingCardLabel.set(state['generatingCardLabel'] ?? 'Card');
    }
  }

  onGenerationCompleted(): void {
    this.generatingCardId.set(null);
    this.store.load();
  }

  onGenerationFailed(err: string): void {
    console.error('Image generation failed:', err);
    this.generatingCardId.set(null);
  }

  onGenerationDismissed(): void {
    this.generatingCardId.set(null);
  }

  // ── Navigation ────────────────────────────────────────
  onCardSelected(cardId: string): void {
    this.#router.navigate(['/card', cardId]);
  }

  onTabChanged(tab: string): void {
    const routes: Record<string, string> = {
      today:   '/checkin',
      spread:  '/spread',
      chat:    '/chat',
      tasks:   '/tasks',
      goals:     '/goals',
      nutrition: '/nutrition',
      profile:   '/profile',
      monitor: '/monitor',
    };
    const route = routes[tab];
    if (route) this.#router.navigate([route]);
  }
}
