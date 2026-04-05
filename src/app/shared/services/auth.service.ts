import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { AppUser } from '../models/app-user.model';
import { environment } from '../../../environments/environment';

const STORAGE_KEY = 'destiny_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  readonly #http   = inject(HttpClient);
  readonly #router = inject(Router);

  private readonly _user = signal<AppUser | null>(this.#loadFromStorage());
  readonly user = this._user.asReadonly();

  // ── Public API ──────────────────────────────────────────────────────────

  isLoggedIn(): boolean {
    return this._user() !== null;
  }

  getUserId(): string | null {
    return this._user()?.id ?? null;
  }

  isOnboardingComplete(): boolean {
    return this._user()?.onboardingComplete ?? false;
  }

  isAdmin(): boolean {
    const id = this.getUserId();
    return id === 'a0098338-2efd-4c90-b97f-1ff57377cae0';
  }

  login(email: string): Observable<any> {
    return this.#http
      .post<any>(`${environment.apiBaseUrl}/api/v1/auth/login`, { email })
      .pipe(
        tap(res => {
          const user: AppUser = res.data;
          this._user.set(user);
          this.#saveToStorage(user);
        }),
      );
  }

  logout(): void {
    this._user.set(null);
    localStorage.removeItem(STORAGE_KEY);
    this.#router.navigate(['/login']);
  }

  completeOnboarding(): void {
    const current = this._user();
    if (!current) return;

    // Update local state immediately
    const updated = { ...current, onboardingComplete: true };
    this._user.set(updated);
    this.#saveToStorage(updated);

    // Persist to backend
    this.#http
      .put<any>(`${environment.apiBaseUrl}/api/v1/users/${current.id}`, {
        onboardingComplete: true,
      }, {
        headers: { 'X-User-Id': current.id },
      })
      .subscribe();
  }

  // ── Private helpers ─────────────────────────────────────────────────────

  #loadFromStorage(): AppUser | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  #saveToStorage(user: AppUser): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch { /* ignore */ }
  }
}
