import { ChangeDetectionStrategy, Component, EventEmitter, inject, Input, Output, signal, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../../shared/services/api.service';
import { SoundService } from '../../../../shared/services/sound.service';

interface FixedBlock { name: string; start: string; end: string; custom?: boolean; }
interface MealTime { name: string; time: string; custom?: boolean; }
interface RecurringReminder { name: string; intervalHours: number; }

@Component({
  selector: 'app-schedule-template-form',
  standalone: true,
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="overlay" (click)="close.emit()">
      <div class="form-panel" (click)="$event.stopPropagation()">
        <div class="form-header">
          <h3>⚙️ Schedule Template</h3>
          <button class="close-btn" (click)="close.emit()">✕</button>
        </div>

        <div class="form-body">
          <!-- Day Type -->
          <div class="field">
            <label>Day Type</label>
            <select [(ngModel)]="dayType">
              <option value="WEEKDAY">Weekday</option>
              <option value="WEEKEND">Weekend</option>
              <option value="TRAVEL">Travel</option>
            </select>
          </div>

          <!-- Terminal Goal -->
          <div class="field-row">
            <div class="field flex-2">
              <label>Terminal Goal</label>
              <input type="text" [(ngModel)]="terminalGoal" placeholder="Sleep" />
            </div>
            <div class="field flex-1">
              <label>Goal Time</label>
              <input type="time" [(ngModel)]="terminalGoalTime" />
            </div>
          </div>

          <!-- Fixed Blocks -->
          <div class="section">
            <div class="section-header">
              <label>Fixed Blocks</label>
              <button class="add-btn" (click)="addFixedBlock()">+</button>
            </div>
            <p class="section-hint">Time ranges AI cannot schedule over</p>
            @for (block of fixedBlocks; track $index) {
              <div class="row-3">
                @if (block.custom) {
                  <input type="text" [(ngModel)]="block.name" placeholder="Custom name" />
                } @else {
                  <select [(ngModel)]="block.name" (ngModelChange)="onBlockTypeChange(block, $event)">
                    @for (opt of blockPresets; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                    <option value="__custom__">Custom...</option>
                  </select>
                }
                <div class="time-field">
                  <span class="time-label">from</span>
                  <input type="time" [(ngModel)]="block.start" />
                </div>
                <div class="time-field">
                  <span class="time-label">to</span>
                  <input type="time" [(ngModel)]="block.end" />
                </div>
                <button class="remove-btn" (click)="fixedBlocks.splice($index, 1)">✕</button>
              </div>
            }
          </div>

          <!-- Meal Times -->
          <div class="section">
            <div class="section-header">
              <label>Meal Times</label>
              <button class="add-btn" (click)="addMealTime()">+</button>
            </div>
            @for (meal of mealTimes; track $index) {
              <div class="row-2">
                @if (meal.custom) {
                  <input type="text" [(ngModel)]="meal.name" placeholder="Custom meal" />
                } @else {
                  <select [(ngModel)]="meal.name" (ngModelChange)="onMealTypeChange(meal, $event)">
                    @for (opt of mealPresets; track opt) {
                      <option [value]="opt">{{ opt }}</option>
                    }
                    <option value="__custom__">Custom...</option>
                  </select>
                }
                <input type="time" [(ngModel)]="meal.time" />
                <button class="remove-btn" (click)="mealTimes.splice($index, 1)">✕</button>
              </div>
            }
          </div>

          <!-- Recurring Reminders -->
          <div class="section">
            <div class="section-header">
              <label>Recurring Reminders</label>
              <button class="add-btn" (click)="addReminder()">+</button>
            </div>
            @for (rem of recurringReminders; track $index) {
              <div class="row-2">
                <input type="text" [(ngModel)]="rem.name" placeholder="Water" />
                <div class="interval-input">
                  <span>every</span>
                  <input type="number" [(ngModel)]="rem.intervalHours" min="1" max="12" />
                  <span>h</span>
                </div>
                <button class="remove-btn" (click)="recurringReminders.splice($index, 1)">✕</button>
              </div>
            }
          </div>
        </div>

        <div class="form-footer">
          <button class="save-btn" (click)="save()" [disabled]="saving()">
            {{ saving() ? 'Saving...' : 'Save Template' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.6);
      z-index: 150;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 16px;
    }

    .form-panel {
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: 16px;
      max-width: 500px;
      width: 100%;
      max-height: 85vh;
      overflow-y: auto;
    }

    .form-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--border);

      h3 { margin: 0; color: var(--text); font-size: 1rem; }
    }

    .close-btn {
      background: none; border: none; color: var(--muted);
      font-size: 1.2rem; cursor: pointer;
      &:hover { color: var(--text); }
    }

    .form-body { padding: 16px; display: flex; flex-direction: column; gap: 16px; }

    .field {
      display: flex; flex-direction: column; gap: 4px;

      label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }

      input, select {
        background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
        padding: 8px 12px; color: var(--text); font-size: 0.9rem;
        &:focus { outline: none; border-color: var(--accent); }
      }
    }

    .field-row { display: flex; gap: 12px; }
    .flex-1 { flex: 1; }
    .flex-2 { flex: 2; }

    .section { display: flex; flex-direction: column; gap: 8px; }

    .section-header {
      display: flex; justify-content: space-between; align-items: center;

      label { font-size: 0.8rem; color: var(--muted); text-transform: uppercase; letter-spacing: 0.5px; }
    }

    .add-btn {
      width: 24px; height: 24px; border-radius: 50%;
      border: 1px solid var(--accent); background: transparent;
      color: var(--accent); font-size: 16px; cursor: pointer;
      display: flex; align-items: center; justify-content: center;
      &:hover { background: var(--accent); color: white; }
    }

    .section-hint {
      font-size: 0.72rem;
      color: var(--muted);
      margin: -4px 0 4px;
      opacity: 0.7;
    }

    .row-2, .row-3 {
      display: flex; gap: 8px; align-items: center;

      input, select {
        flex: 1;
        background: var(--bg2); border: 1px solid var(--border); border-radius: 8px;
        padding: 6px 10px; color: var(--text); font-size: 0.85rem;
        &:focus { outline: none; border-color: var(--accent); }
      }
    }

    .time-field {
      display: flex; align-items: center; gap: 4px;

      .time-label { font-size: 0.72rem; color: var(--muted); white-space: nowrap; }
      input { width: 100%; }
    }

    .interval-input {
      display: flex; align-items: center; gap: 4px;
      font-size: 0.85rem; color: var(--muted);

      input { width: 50px; text-align: center; }
    }

    .remove-btn {
      background: none; border: none; color: var(--danger);
      opacity: 0.5; cursor: pointer; font-size: 14px;
      &:hover { opacity: 1; }
    }

    .form-footer {
      padding: 16px;
      border-top: 1px solid var(--border);
    }

    .save-btn {
      width: 100%;
      background: linear-gradient(135deg, var(--accent), var(--purple));
      color: white; border: none; padding: 10px 20px; border-radius: 10px;
      font-size: 0.95rem; font-weight: 600; cursor: pointer;
      transition: opacity 0.2s;
      &:hover:not(:disabled) { opacity: 0.9; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `]
})
export class ScheduleTemplateFormComponent implements OnInit {
  @Input() initialDayType = 'WEEKDAY';
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private readonly api = inject(ApiService);
  private readonly sound = inject(SoundService);

  dayType = 'WEEKDAY';
  terminalGoal = 'Sleep';
  terminalGoalTime = '21:00';
  fixedBlocks: FixedBlock[] = [];
  mealTimes: MealTime[] = [];
  recurringReminders: RecurringReminder[] = [];
  saving = signal(false);

  ngOnInit() {
    this.dayType = this.initialDayType;
    this.loadExisting();
  }

  loadExisting() {
    console.log('[ScheduleTemplate] Loading templates for dayType:', this.dayType);
    this.api.getScheduleTemplates().subscribe({
      next: (templates) => {
        console.log('[ScheduleTemplate] API returned:', templates);
        const match = templates?.find((t: any) => t.dayType === this.dayType);
        console.log('[ScheduleTemplate] Matched template:', match);
        if (match) {
          this.terminalGoal = match.terminalGoal || 'Sleep';
          this.terminalGoalTime = this.normalizeTime(match.terminalGoalTime) || '21:00';
          this.fixedBlocks = this.parseJsonSafe(match.fixedBlocks, []).map((b: FixedBlock) => ({
            ...b,
            custom: !this.blockPresets.includes(b.name),
          }));
          this.mealTimes = this.parseJsonSafe(match.mealTimes, []).map((m: MealTime) => ({
            ...m,
            custom: !this.mealPresets.includes(m.name),
          }));
          this.recurringReminders = this.parseJsonSafe(match.recurringReminders, []);
          console.log('[ScheduleTemplate] Loaded:', {
            terminalGoal: this.terminalGoal,
            terminalGoalTime: this.terminalGoalTime,
            fixedBlocks: this.fixedBlocks,
            mealTimes: this.mealTimes,
            recurringReminders: this.recurringReminders,
          });
        } else {
          console.log('[ScheduleTemplate] No match found — showing defaults');
        }
      },
      error: (err) => console.error('[ScheduleTemplate] Load failed:', err),
    });
  }

  /** Parse JSON string or return as-is if already an object. */
  private parseJsonSafe(value: any, fallback: any): any {
    if (!value) return fallback;
    if (typeof value === 'string') {
      try { return JSON.parse(value); } catch { return fallback; }
    }
    return value; // already parsed object/array
  }

  /** Normalize LocalTime: "21:00:00" → "21:00", [21,0] → "21:00" */
  private normalizeTime(value: any): string {
    if (!value) return '';
    if (Array.isArray(value)) {
      return `${String(value[0]).padStart(2, '0')}:${String(value[1] || 0).padStart(2, '0')}`;
    }
    if (typeof value === 'string') {
      return value.replace(/^(\d{2}:\d{2})(:\d{2})?$/, '$1');
    }
    return '';
  }

  blockPresets = ['Work', 'School', 'Meeting', 'Family', 'Nap'];
  mealPresets = ['Breakfast', 'Lunch', 'Dinner', 'Snack', 'Pre-workout', 'Post-workout'];

  addFixedBlock() { this.fixedBlocks.push({ name: 'Work', start: '09:00', end: '17:00' }); }
  addMealTime() { this.mealTimes.push({ name: 'Lunch', time: '12:00' }); }
  addReminder() { this.recurringReminders.push({ name: '', intervalHours: 2 }); }

  onBlockTypeChange(block: FixedBlock, value: string) {
    if (value === '__custom__') {
      block.name = '';
      block.custom = true;
    }
  }

  onMealTypeChange(meal: MealTime, value: string) {
    if (value === '__custom__') {
      meal.name = '';
      meal.custom = true;
    }
  }

  save() {
    this.saving.set(true);
    const payload = {
      dayType: this.dayType,
      terminalGoal: this.terminalGoal,
      terminalGoalTime: this.terminalGoalTime, // "HH:mm" → backend parses as LocalTime
      fixedBlocks: JSON.stringify(this.fixedBlocks.filter(b => b.name.trim())),
      mealTimes: JSON.stringify(this.mealTimes.filter(m => m.name.trim())),
      recurringReminders: JSON.stringify(this.recurringReminders.filter(r => r.name.trim())),
    };
    console.log('[ScheduleTemplate] Saving:', payload);
    this.api.saveScheduleTemplate(payload).subscribe({
      next: (res) => {
        console.log('[ScheduleTemplate] Saved OK:', res);
        this.sound.play('confirm');
        this.saving.set(false);
        this.saved.emit();
        this.close.emit();
      },
      error: (err) => {
        console.error('[ScheduleTemplate] Save failed:', err);
        this.saving.set(false);
      },
    });
  }
}
