import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  inject,
  NgZone,
  OnInit,
  signal,
  ViewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { marked } from 'marked';

import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
import { SoundService } from '../../shared/services/sound.service';
import { ScheduleTemplateFormComponent } from '../ai-tasks/components/schedule-template-form/schedule-template-form.component';
import { BLUEPRINT_QUICK_ACTIONS, QuickAction } from './blueprint-prompts';
import { GENERAL_QUICK_ACTIONS } from './general-prompts';

interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  model: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  html?: SafeHtml;          // pre-rendered markdown
  actions?: string[];        // parsed >> action lines
  usage?: TokenUsage;        // token/cost data from backend
}

interface SystemLog {
  id: number;
  text: string;
  type: 'info' | 'success' | 'error';
}

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [FormsModule, DecimalPipe, NavBarComponent, ScheduleTemplateFormComponent],
  templateUrl: './ai-chat-page.component.html',
  styleUrl: './ai-chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AiChatPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly sound = inject(SoundService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly zone = inject(NgZone);

  @ViewChild('messagesArea') messagesArea!: ElementRef;

  isAdmin = this.auth.isAdmin();

  // ── State ──────────────────────────────────────────────────────────────

  messages = signal<ChatMessage[]>([]);
  streaming = signal(false);
  streamingText = signal('');
  streamingHtml = signal<SafeHtml>('');
  showScrollBtn = signal(false);
  showQuickActions = signal(false);
  showTemplateForm = signal(false);
  activePrompts = signal<string[]>([]);
  systemLogs = signal<SystemLog[]>([]);

  inputText = '';
  conversationId: string | undefined;

  private userScrolledUp = false;
  private promptMap = new Map<string, string>();
  private logIdCounter = 0;

  // ── Config ─────────────────────────────────────────────────────────────

  suggestions = [
    '📅 Generate today\'s plan',
    '💪 Create a workout plan',
    '🥗 Plan my meals this week',
    '⏰ Remind me to stretch at 3pm',
  ];

  /** Pinned shortcuts always visible above input, even mid-conversation. */
  pinnedActions = [
    { label: '📅 Plan', promptLabel: '📅 Daily Plan' },
  ];

  quickActions: QuickAction[] = [...BLUEPRINT_QUICK_ACTIONS, ...GENERAL_QUICK_ACTIONS];

  // ── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadLatestConversation();
    this.handleActionParam();
  }

  private handleActionParam(): void {
    const action = this.route.snapshot.queryParams['action'];
    if (action === 'daily-plan') {
      this.router.navigate([], { queryParams: {}, replaceUrl: true });
      setTimeout(() => this.generateDailyPlanViaChat(), 500);
    }
  }

  // ── Scroll ─────────────────────────────────────────────────────────────

  onScroll(): void {
    const el = this.messagesArea?.nativeElement;
    if (!el) return;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 60;
    this.userScrolledUp = !atBottom;
    this.showScrollBtn.set(!atBottom);
  }

  scrollToBottom(): void {
    try {
      const el = this.messagesArea?.nativeElement;
      if (!el) return;
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      this.userScrolledUp = false;
      this.showScrollBtn.set(false);
    } catch { /* noop */ }
  }

  // ── Quick actions ──────────────────────────────────────────────────────

  toggleQuickActions(): void {
    this.showQuickActions.update(v => !v);
  }

  injectPrompt(label: string, prompt: string): void {
    if (!this.activePrompts().includes(label)) {
      this.activePrompts.update(p => [...p, label]);
      this.promptMap.set(label, prompt);
    }
    this.showQuickActions.set(false);
    setTimeout(() => this.focusTextarea());
  }

  removePrompt(label: string): void {
    this.activePrompts.update(p => p.filter(l => l !== label));
    this.promptMap.delete(label);
  }

  sendPinnedAction(promptLabel: string): void {
    if (promptLabel === '📅 Daily Plan') {
      this.generateDailyPlanViaChat();
    } else {
      const qa = this.quickActions.find(q => q.label === promptLabel);
      if (qa) this.sendMessage(qa.prompt);
    }
  }

  /**
   * Fetches schedule template → builds rich prompt with all user data baked in → sends to AI.
   * If no template exists, opens the template setup form first.
   */
  private generateDailyPlanViaChat(): void {
    this.api.getScheduleTemplates().subscribe({
      next: (templates) => {
        if (!templates || templates.length === 0) {
          // No template yet → show setup form
          this.showTemplateForm.set(true);
          return;
        }

        // Pick weekday or weekend template
        const isWeekend = new Date().getDay() === 0 || new Date().getDay() === 6;
        const template = templates.find((t: any) => t.dayType === (isWeekend ? 'WEEKEND' : 'WEEKDAY'))
          || templates[0];

        const prompt = this.buildDailyPlanPrompt(template);
        this.sendMessage(prompt);
      },
      error: () => {
        // Fallback: open template form
        this.showTemplateForm.set(true);
      },
    });
  }

  private buildDailyPlanPrompt(template: any): string {
    const d = new Date();
    const today = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
    const now = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    const dayLabel = isWeekend ? 'Weekend' : 'Weekday';

    // Strip seconds from time (21:00:00 → 21:00)
    const goalTime = this.formatTime24(template.terminalGoalTime) || '21:00';
    const goalName = template.terminalGoal || 'Sleep';

    let fixedBlocks = 'None set';
    let mealTimes = 'None set';
    let reminders = 'None set';

    try {
      const blocks = template.fixedBlocks ? JSON.parse(template.fixedBlocks) : [];
      if (blocks.length) fixedBlocks = blocks.map((b: any) => `${b.name}: ${this.formatTime24(b.start)}–${this.formatTime24(b.end)}`).join(', ');
    } catch {}
    try {
      const meals = template.mealTimes ? JSON.parse(template.mealTimes) : [];
      if (meals.length) mealTimes = meals.map((m: any) => `${m.name} at ${this.formatTime24(m.time)}`).join(', ');
    } catch {}
    try {
      const rems = template.recurringReminders ? JSON.parse(template.recurringReminders) : [];
      if (rems.length) reminders = rems.map((r: any) => `${r.name} every ${r.intervalHours}h`).join(', ');
    } catch {}

    return `Generate my daily plan for today (${today}, ${dayLabel}). Current time: ${now}.

MY SCHEDULE:
- Terminal goal: ${goalName} at ${goalTime}
- Fixed blocks: ${fixedBlocks}
- Meal times: ${mealTimes}
- Recurring reminders: ${reminders}

BACKWARD PLANNING — start from ${goalName} at ${goalTime}, work backward to now (${now}):
1. ${goalTime} = ${goalName} (HARD DEADLINE — plan must end here exactly)
2. Fill backward: wind-down → last meal → activities → reminders → current time
3. Never overlap fixed blocks
4. 15 min buffer between tasks
5. Shopping items → parent item "Shopping" with child checklist items
6. Include hydration/recurring reminders during waking hours

Show a markdown timeline table. Then append:
[ACTION]{"type":"DAILY_PLAN","date":"YYYY-MM-DD","items":[{title,category,scheduledTime("HH:mm"),estimatedDurationMinutes,reminderOffsetMinutes|null,children:[{title,category}]}]}[/ACTION]
Categories: MEAL_PREP|MEAL|EXERCISE|WORK|HYDRATION|CHORE|SELF_CARE|SHOPPING|OTHER. Children have no scheduledTime. Do NOT ask questions.`;
  }

  /** Strip seconds from time string: "21:00:00" → "21:00", pass through "21:00" or null. */
  private formatTime24(time: string | null | undefined): string {
    if (!time) return '';
    return time.replace(/^(\d{2}:\d{2})(:\d{2})?$/, '$1');
  }

  /** Called when template form is saved from within chat. */
  onTemplateSaved(): void {
    this.showTemplateForm.set(false);
    this.sound.play('confirm');
    // Now auto-generate with the newly saved template
    setTimeout(() => this.generateDailyPlanViaChat(), 300);
  }

  // ── Input handling ─────────────────────────────────────────────────────

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage(this.inputText);
    }
  }

  autoResize(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    textarea.style.height = Math.min(textarea.scrollHeight, 150) + 'px';
    textarea.style.overflowY = textarea.scrollHeight > 150 ? 'auto' : 'hidden';
  }

  // ── Messaging ──────────────────────────────────────────────────────────

  sendMessage(text: string): void {
    const prompts = this.activePrompts();
    if (!text.trim() && prompts.length === 0) return;
    if (this.streaming()) return;

    const promptTexts = prompts.map(label => this.promptMap.get(label) || label);
    const fullText = [...promptTexts, text.trim()].filter(Boolean).join('\n');
    const displayText = prompts.length > 0
      ? `[${prompts.join(', ')}] ${text.trim()}`.trim()
      : text.trim();

    this.inputText = '';
    this.activePrompts.set([]);
    this.promptMap.clear();
    this.resetTextarea();

    this.addMessage('user', displayText);
    this.userScrolledUp = false;
    setTimeout(() => this.scrollToBottom());

    this.streaming.set(true);
    this.streamingText.set('');
    this.streamingHtml.set('');

    const logId = this.pushLog('Sending message…');

    let fullResponse = '';
    let thinkingLogId: number | null = null;
    let lastUsage: TokenUsage | null = null;
    const sendTime = performance.now();
    let firstChunkTime = 0;
    let lastChunkTime = 0;
    let chunkCount = 0;
    console.log(`[TIMING][UI] Message sent at ${new Date().toISOString()}`);

    this.api.chatStream(fullText, this.conversationId).subscribe({
      next: (chunk) => this.zone.run(() => {
        // Parse [USAGE] metadata from backend
        if (chunk.startsWith('[USAGE]')) {
          try {
            lastUsage = JSON.parse(chunk.slice(7));
            console.log('[TIMING][UI] Usage received:', lastUsage);
          } catch { /* ignore parse errors */ }
          return;
        }

        chunkCount++;
        lastChunkTime = performance.now();
        if (!thinkingLogId) {
          firstChunkTime = lastChunkTime;
          console.log(`[TIMING][UI] First chunk received in component: ${(firstChunkTime - sendTime).toFixed(0)}ms after send`);
          this.removeLog(logId);
          thinkingLogId = this.pushLog('AI is thinking…');
        }
        fullResponse += chunk;
        // Strip [ACTION]...[/ACTION] blocks so user doesn't see raw JSON
        const visibleResponse = fullResponse.replace(/\[ACTION\].*?\[\/ACTION\]/gs, '').trim();
        this.streamingText.set(visibleResponse);
        this.streamingHtml.set(this.toHtml(visibleResponse));
        if (!this.userScrolledUp) {
          setTimeout(() => this.scrollToBottom());
        }
      }),
      error: () => this.zone.run(() => {
        console.error(`[TIMING][UI] Stream error after ${(performance.now() - sendTime).toFixed(0)}ms`);
        this.removeLog(logId);
        if (thinkingLogId) this.removeLog(thinkingLogId);
        this.pushLog('Failed to get response', 'error', 3000);
        this.streaming.set(false);
        this.addMessage('assistant', 'Sorry, something went wrong. Please try again.');
      }),
      complete: () => this.zone.run(() => {
        const completeTime = performance.now();
        console.log(`[TIMING][UI] Stream complete callback: ${(completeTime - sendTime).toFixed(0)}ms after send, ${chunkCount} chunks`);
        console.log(`[TIMING][UI] Time between last chunk and complete: ${(completeTime - lastChunkTime).toFixed(0)}ms`);

        if (thinkingLogId) this.removeLog(thinkingLogId);
        this.pushLog('Response complete', 'success', 2000);
        this.streaming.set(false);

        const buildStart = performance.now();
        const cleanResponse = (fullResponse || 'No response received.').replace(/\[ACTION\].*?\[\/ACTION\]/gs, '').trim();
        this.addMessage('assistant', cleanResponse, undefined, lastUsage);
        const buildEnd = performance.now();
        console.log(`[TIMING][UI] buildMessage + addMessage: ${(buildEnd - buildStart).toFixed(0)}ms`);

        // Check if actions were parsed
        const lastMsg = this.messages()[this.messages().length - 1];
        console.log(`[TIMING][UI] Action buttons found: ${lastMsg?.actions?.length ?? 0}`, lastMsg?.actions);
        console.log(`[TIMING][UI] Total time from send to action buttons rendered: ${(buildEnd - sendTime).toFixed(0)}ms`);

        if (!this.userScrolledUp) {
          setTimeout(() => this.scrollToBottom());
        }
        if (!this.conversationId) {
          this.captureConversationId();
        }
      }),
    });
  }

  // ── Navigation ─────────────────────────────────────────────────────────

  onTabChanged(tab: NavTab): void {
    const routes: Record<string, string> = {
      spread: '/spread', chat: '/chat', tasks: '/tasks',
      nutrition: '/nutrition', profile: '/profile', today: '/checkin', monitor: '/monitor',
    };
    this.router.navigate([routes[tab] || '/spread']);
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private loadLatestConversation(): void {
    const logId = this.pushLog('Loading conversation…');
    this.api.getConversations().subscribe({
      next: (convs: any[]) => {
        if (!convs?.length) {
          this.removeLog(logId);
          return;
        }
        const latest = convs[0];
        this.conversationId = latest.id;
        this.api.getConversation(latest.id).subscribe({
          next: (conv: any) => {
            const all: ChatMessage[] = (conv.messages || []).map((m: any) =>
              this.buildMessage(
                m.role === 'USER' ? 'user' : 'assistant',
                m.content,
                new Date(m.createdAt),
              ),
            );
            this.messages.set(all.slice(-20));
            this.removeLog(logId);
            this.pushLog(`Loaded ${this.messages().length} messages`, 'success', 2000);
            setTimeout(() => {
              try {
                this.messagesArea?.nativeElement?.scrollTo({
                  top: this.messagesArea.nativeElement.scrollHeight,
                });
              } catch { /* noop */ }
            });
          },
          error: () => {
            this.removeLog(logId);
            this.pushLog('Failed to load messages', 'error', 3000);
          },
        });
      },
      error: () => {
        this.removeLog(logId);
        this.pushLog('Failed to connect', 'error', 3000);
      },
    });
  }

  /** Build a message with pre-rendered markdown HTML */
  private buildMessage(role: 'user' | 'assistant', content: string, timestamp?: Date, usage?: TokenUsage | null): ChatMessage {
    const lines = content.split('\n');
    const mainLines = lines.filter(l => !l.trim().startsWith('>>'));
    const actions = lines
      .filter(l => l.trim().startsWith('>>'))
      .map(l => l.trim().replace(/^>>\s*/, ''));
    return {
      role,
      content,
      timestamp: timestamp ?? new Date(),
      html: this.toHtml(mainLines.join('\n')),
      actions: actions.length > 0 ? actions : undefined,
      usage: usage ?? undefined,
    };
  }

  /** Convert markdown text → SafeHtml */
  private toHtml(text: string): SafeHtml {
    let html = marked.parse(text, { async: false }) as string;
    html = html
      .replace(/<table>/g, '<div class="table-wrapper"><table>')
      .replace(/<\/table>/g, '</table></div>');
    return this.sanitizer.bypassSecurityTrustHtml(html);
  }

  private addMessage(role: 'user' | 'assistant', content: string, timestamp?: Date, usage?: TokenUsage | null): void {
    this.messages.update(msgs => [...msgs, this.buildMessage(role, content, timestamp, usage)]);
  }

  private captureConversationId(): void {
    this.api.getConversations().subscribe({
      next: (convs: any[]) => {
        if (convs?.length) this.conversationId = convs[0].id;
      },
    });
  }

  private focusTextarea(): void {
    const ta = document.querySelector('.chat-input') as HTMLTextAreaElement;
    ta?.focus();
  }

  private resetTextarea(): void {
    const ta = document.querySelector('.chat-input') as HTMLTextAreaElement;
    if (ta) ta.style.height = 'auto';
  }

  // ── System log helpers ──────────────────────────────────────────────────

  private pushLog(text: string, type: 'info' | 'success' | 'error' = 'info', autoDismissMs?: number): number {
    const id = ++this.logIdCounter;
    this.systemLogs.update(logs => [...logs, { id, text, type }]);
    if (autoDismissMs) {
      setTimeout(() => this.removeLog(id), autoDismissMs);
    }
    return id;
  }

  private removeLog(id: number): void {
    this.systemLogs.update(logs => logs.filter(l => l.id !== id));
  }
}
