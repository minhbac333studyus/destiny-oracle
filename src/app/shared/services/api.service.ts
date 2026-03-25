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

  // ── AI Chat ──────────────────────────────────────────────────────────────

  chatStream(message: string, conversationId?: string): Observable<string> {
    return new Observable(observer => {
      const body = JSON.stringify({ message, conversationId: conversationId || null });
      fetch(`${this.baseUrl}/api/v1/chat/stream`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-User-Id': this.userId },
        body,
      }).then(async res => {
        const reader = res.body?.getReader();
        const decoder = new TextDecoder();
        if (!reader) { observer.complete(); return; }
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const text = decoder.decode(value, { stream: true });
          const lines = text.split('\n').filter(l => l.startsWith('data:'));
          for (const line of lines) {
            observer.next(line.replace('data:', ''));
          }
        }
        observer.complete();
      }).catch(err => observer.error(err));
    });
  }

  getConversations(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/chat/conversations`, { headers: this.headers() });
  }

  getConversation(convId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/chat/conversations/${convId}`, { headers: this.headers() });
  }

  deleteConversation(convId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/chat/conversations/${convId}`, { headers: this.headers() });
  }

  // ── Saved Plans ─────────────────────────────────────────────────────────

  getPlans(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/plans`, { headers: this.headers() });
  }

  getPlan(planId: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/plans/${planId}`, { headers: this.headers() });
  }

  getPlanBySlug(slug: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/plans/slug/${slug}`, { headers: this.headers() });
  }

  createPlan(plan: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/plans`, plan, { headers: this.headers() });
  }

  updatePlan(planId: string, update: any): Observable<any> {
    return this.http.put<any>(`${this.baseUrl}/api/v1/plans/${planId}`, update, { headers: this.headers() });
  }

  deletePlan(planId: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/plans/${planId}`, { headers: this.headers() });
  }

  // ── Tasks ───────────────────────────────────────────────────────────────

  getActiveTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/tasks/active`, { headers: this.headers() });
  }

  getCompletedTasks(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/tasks/completed`, { headers: this.headers() });
  }

  toggleTaskStep(stepId: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/api/v1/tasks/steps/${stepId}/toggle`, {}, { headers: this.headers() });
  }

  abandonTask(taskId: string): Observable<void> {
    return this.http.patch<void>(`${this.baseUrl}/api/v1/tasks/${taskId}/abandon`, {}, { headers: this.headers() });
  }

  // ── Reminders ───────────────────────────────────────────────────────────

  getReminders(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/api/v1/reminders`, { headers: this.headers() });
  }

  createReminder(reminder: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/api/v1/reminders`, reminder, { headers: this.headers() });
  }

  completeReminder(id: string): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/api/v1/reminders/${id}/complete`, {}, { headers: this.headers() });
  }

  snoozeReminder(id: string, minutes: number): Observable<any> {
    return this.http.patch<any>(`${this.baseUrl}/api/v1/reminders/${id}/snooze`, { minutes }, { headers: this.headers() });
  }

  deleteReminder(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/api/v1/reminders/${id}`, { headers: this.headers() });
  }

  // ── Insights ────────────────────────────────────────────────────────────

  getTodayInsight(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/api/v1/insights/today`, { headers: this.headers() })
      .pipe(catchError(() => of(null)));
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
