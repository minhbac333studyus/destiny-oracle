import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CardStage } from '../models/card-stage.model';
import { SpreadCardSummary, CardDetail } from './mock-card.service';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly auth    = inject(AuthService);

  constructor(private readonly http: HttpClient) {}

  private get userId(): string {
    return this.auth.getUserId() ?? '';
  }

  private headers(): HttpHeaders {
    return new HttpHeaders({ 'X-User-Id': this.userId });
  }

  // ── Cards ──────────────────────────────────────────────────────────────────

  getAllCards(): Observable<SpreadCardSummary[]> {
    return this.http
      .get<any>(`${this.baseUrl}/api/v1/cards`, { headers: this.headers() })
      .pipe(map(res => (res.data || []).map((c: any) => this.mapToSpreadCard(c))));
  }

  getCard(cardId: string): Observable<CardDetail> {
    return this.http
      .get<any>(`${this.baseUrl}/api/v1/cards/${cardId}`, { headers: this.headers() })
      .pipe(map(res => this.mapToCardDetail(res.data)));
  }

  addCard(request: { aspectLabel: string; fearText: string; dreamText: string; icon?: string }): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/cards`, request, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  deleteCard(cardId: string): Observable<void> {
    return this.http
      .delete<any>(`${this.baseUrl}/api/v1/cards/${cardId}`, { headers: this.headers() })
      .pipe(map(() => void 0));
  }

  updateCard(cardId: string, updates: any): Observable<any> {
    return this.http
      .patch<any>(`${this.baseUrl}/api/v1/cards/${cardId}`, updates, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  completeHabit(cardId: string, habitId: string, completed: boolean): Observable<any> {
    return this.http
      .put<any>(
        `${this.baseUrl}/api/v1/cards/${cardId}/habits/${habitId}/complete`,
        { completed },
        { headers: this.headers() },
      )
      .pipe(map(res => res.data));
  }

  // ── User ───────────────────────────────────────────────────────────────────

  getUser(): Observable<any> {
    return this.http
      .get<any>(`${this.baseUrl}/api/v1/users/${this.userId}`, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  updateUser(updates: any): Observable<any> {
    return this.http
      .put<any>(`${this.baseUrl}/api/v1/users/${this.userId}`, updates, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  uploadAvatar(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/users/${this.userId}/avatar`, formData, {
        headers: new HttpHeaders({ 'X-User-Id': this.userId }),
      })
      .pipe(map(res => res.data));
  }

  generateChibi(): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/users/${this.userId}/generate-chibi`, {}, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  // ── Image generation ───────────────────────────────────────────────────────

  generateAllImages(cardId: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/cards/${cardId}/generate-images`, {}, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  generateStageImage(cardId: string, stage: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/cards/${cardId}/generate-images/${stage}`, {}, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  getLatestJob(cardId: string): Observable<any | null> {
    return this.http
      .get<any>(`${this.baseUrl}/api/v1/cards/${cardId}/jobs/latest`, { headers: this.headers() })
      .pipe(
        map(res => res.data),
        catchError(() => of(null)), // returns null when no job exists yet (404)
      );
  }

  generateStageContent(cardId: string): Observable<any> {
    return this.http
      .post<any>(`${this.baseUrl}/api/v1/cards/${cardId}/generate-stage-content`, {}, { headers: this.headers() })
      .pipe(map(res => res.data));
  }

  // ── Mappers ────────────────────────────────────────────────────────────────

  private mapToSpreadCard(c: any): SpreadCardSummary {
    return {
      id:              c.id,
      aspectKey:       c.aspectKey,
      aspectLabel:     c.aspectLabel,
      cardTitle:       c.cardTitle || c.aspectLabel,
      stage:           (c.stage || c.currentStage || 'storm') as CardStage,
      imageUrl:        this.resolveImageUrl(c.imageUrl),
      progressPercent: c.stageProgressPercent || 0,
      streakDays:      c.streakDays || 0,
      hasUnreadUpdate: c.hasUnreadUpdate ?? false,
    };
  }

  private mapToCardDetail(d: any): CardDetail {
    return {
      id:          d.id,
      aspectKey:   d.aspectKey,
      aspectLabel: d.aspectLabel,
      cardTitle:   d.cardTitle || '',
      cardTagline: d.cardTagline || '',
      loreText:    d.loreText || '',
      imageUrl:    this.resolveImageUrl(d.imageUrl),
      lastUpdated: d.lastUpdated ? new Date(d.lastUpdated) : new Date(),
      stats: {
        currentStage:         (d.stats?.currentStage || 'storm') as CardStage,
        stageProgressPercent: d.stats?.stageProgressPercent || 0,
        totalCheckIns:        d.stats?.totalCheckIns || d.stats?.totalCheckins || 0,
        longestStreak:        d.stats?.longestStreak || 0,
        currentStreak:        d.stats?.currentStreak || 0,
        daysAtCurrentStage:   d.stats?.daysAtCurrentStage || d.stats?.daysAtStage || 0,
      },
      habits: (d.habits || []).map((h: any) => ({
        id:             h.id,
        text:           h.text || h.habitText || '',
        frequency:      h.frequency || 'daily',
        completedToday: h.completedToday ?? h.isCompletedToday ?? false,
        streakDays:     h.currentStreak || h.streakDays || 0,
      })),
      imageHistory: (d.imageHistory || []).map((img: any) => ({
        id:            img.id || '',
        imageUrl:      this.resolveImageUrl(img.imageUrl),
        stage:         img.stage as CardStage,
        generatedAt:   img.generatedAt ? new Date(img.generatedAt) : new Date(),
        promptSummary: img.promptSummary || '',
      })),
      fearOriginal:  d.fearOriginal || '',
      dreamOriginal: d.dreamOriginal || '',
      stageContent:  this.normalizeStageContent(d.stageContent),
    };
  }

  /** Backend may return stageContent keys as UPPERCASE (STORM) or lowercase (storm). Normalize to lowercase. */
  private normalizeStageContent(
    raw: any,
  ): Partial<Record<CardStage, { title: string; tagline: string; lore: string; actionScene?: string }>> {
    if (!raw) return {};
    const result: any = {};
    for (const key of Object.keys(raw)) {
      result[key.toLowerCase()] = raw[key];
    }
    return result;
  }

  private resolveImageUrl(url: string | null | undefined): string {
    if (!url) return 'assets/health-user1.png';
    if (url.startsWith('http')) return url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return url;
  }
}
