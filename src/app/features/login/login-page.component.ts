import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../shared/services/auth.service';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  readonly #auth   = inject(AuthService);
  readonly #router = inject(Router);

  email = '';
  readonly loading = signal(false);
  readonly error   = signal('');

  onSubmit(): void {
    const trimmed = this.email.trim();
    if (!trimmed) return;

    this.loading.set(true);
    this.error.set('');

    this.#auth.login(trimmed).subscribe({
      next: (res) => {
        this.loading.set(false);
        const user = res?.data ?? res;
        if (user?.onboardingComplete) {
          this.#router.navigate(['/spread']);
        } else {
          this.#router.navigate(['/onboarding']);
        }
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Login failed. Please try again.');
      },
    });
  }
}
