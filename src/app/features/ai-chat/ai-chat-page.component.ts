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
import { Router } from '@angular/router';
import { marked } from 'marked';

import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';
import { AuthService } from '../../shared/services/auth.service';
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
  imports: [FormsModule, DecimalPipe, NavBarComponent],
  templateUrl: './ai-chat-page.component.html',
  styleUrl: './ai-chat-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class AiChatPageComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
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
  activePrompts = signal<string[]>([]);
  systemLogs = signal<SystemLog[]>([]);

  inputText = '';
  conversationId: string | undefined;

  private userScrolledUp = false;
  private promptMap = new Map<string, string>();
  private logIdCounter = 0;

  // ── Config ─────────────────────────────────────────────────────────────

  suggestions = [
    '💪 Create a workout plan',
    '🥗 Plan my meals this week',
    '⏰ Remind me to stretch at 3pm',
    '📊 How was my day?',
  ];

  quickActions: QuickAction[] = [...BLUEPRINT_QUICK_ACTIONS, ...GENERAL_QUICK_ACTIONS];

  // ── Lifecycle ──────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.loadLatestConversation();
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
