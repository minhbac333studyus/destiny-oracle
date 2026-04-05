import { Injectable, signal } from '@angular/core';

export type SoundType = 'notification' | 'complete' | 'confirm';

@Injectable({ providedIn: 'root' })
export class SoundService {
  private readonly STORAGE_KEY = 'destiny_sound_enabled';
  private readonly cache = new Map<SoundType, HTMLAudioElement>();

  readonly enabled = signal<boolean>(this.loadEnabled());

  toggle(): void {
    const next = !this.enabled();
    this.enabled.set(next);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(next));
  }

  play(type: SoundType): void {
    if (!this.enabled()) return;

    try {
      let audio = this.cache.get(type);
      if (!audio) {
        audio = new Audio(`assets/sounds/${type}.wav`);
        audio.volume = type === 'notification' ? 0.6 : 0.4;
        this.cache.set(type, audio);
      }
      audio.currentTime = 0;
      audio.play().catch(() => { /* browser blocked autoplay — silent fallback */ });
    } catch {
      // no-op — sound is enhancement, never critical
    }
  }

  private loadEnabled(): boolean {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored !== null ? JSON.parse(stored) : true; // default ON
  }
}
