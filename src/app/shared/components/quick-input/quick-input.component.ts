import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivityParserService, ParsedActivity } from '../../services/activity-parser.service';
import { AspectIconPipe } from '../../pipes/aspect-icon.pipe';

@Component({
  selector: 'app-quick-input',
  standalone: true,
  imports: [FormsModule, AspectIconPipe],
  templateUrl: './quick-input.component.html',
  styleUrl: './quick-input.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickInputComponent {
  readonly #parser = inject(ActivityParserService);

  inputText = '';
  readonly lastParsed = signal<ParsedActivity | null>(null);
  readonly showConfirmation = signal(false);

  onSubmit(): void {
    const text = this.inputText.trim();
    if (!text) return;

    const activity = this.#parser.parse(text);
    this.lastParsed.set(activity);
    this.showConfirmation.set(true);
    this.inputText = '';

    // Auto-hide confirmation after 4 seconds
    setTimeout(() => this.showConfirmation.set(false), 4000);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSubmit();
    }
  }
}
