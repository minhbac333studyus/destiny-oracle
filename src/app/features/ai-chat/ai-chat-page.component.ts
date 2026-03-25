import { ChangeDetectionStrategy, Component, inject, signal, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { NavBarComponent, NavTab } from '../../shared/components/nav-bar/nav-bar.component';
import { ApiService } from '../../shared/services/api.service';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

@Component({
  selector: 'app-ai-chat-page',
  standalone: true,
  imports: [FormsModule, NavBarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="chat-page">
      <app-nav-bar activeTab="chat" (tabChanged)="onTabChanged($event)" />

      <div class="chat-container">
        <div class="chat-header">
          <h2>Destiny Oracle AI</h2>
          <p class="subtitle">Your personal growth assistant</p>
        </div>

        <div class="messages-area" #messagesArea>
          @if (messages().length === 0) {
            <div class="empty-state">
              <div class="oracle-icon">🔮</div>
              <h3>Start a conversation</h3>
              <p>Ask me about workouts, meal plans, habits, or anything else.</p>
              <div class="suggestions">
                @for (s of suggestions; track s) {
                  <button class="suggestion-chip" (click)="sendMessage(s)">{{ s }}</button>
                }
              </div>
            </div>
          }

          @for (msg of messages(); track $index) {
            <div class="message" [class.user]="msg.role === 'user'" [class.assistant]="msg.role === 'assistant'">
              @if (msg.role === 'assistant') {
                <div class="avatar">🔮</div>
              }
              <div class="bubble">
                <div class="bubble-content">{{ msg.content }}</div>
              </div>
            </div>
          }

          @if (streaming()) {
            <div class="message assistant">
              <div class="avatar">🔮</div>
              <div class="bubble">
                <div class="bubble-content">{{ streamingText() }}<span class="cursor">▊</span></div>
              </div>
            </div>
          }
        </div>

        <div class="input-area">
          <div class="input-wrapper">
            <input
              type="text"
              [(ngModel)]="inputText"
              (keydown.enter)="sendMessage(inputText)"
              placeholder="Ask Destiny Oracle anything..."
              [disabled]="streaming()"
              class="chat-input"
            />
            <button
              class="send-btn"
              (click)="sendMessage(inputText)"
              [disabled]="streaming() || !inputText.trim()">
              ➤
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @use '../../../styles/tokens' as *;

    .chat-page { min-height: 100vh; background: var(--bg-base, #0c1028); display: flex; flex-direction: column; }
    .chat-container { flex: 1; display: flex; flex-direction: column; max-width: 800px; margin: 0 auto; width: 100%; padding: 0 16px; }
    .chat-header { text-align: center; padding: 16px 0 8px; }
    .chat-header h2 { color: #f5f0ff; margin: 0; font-size: 1.25rem; }
    .subtitle { color: #9ca3af; font-size: 0.85rem; margin: 4px 0 0; }

    .messages-area { flex: 1; overflow-y: auto; padding: 16px 0; display: flex; flex-direction: column; gap: 12px; }

    .empty-state { flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; color: #9ca3af; gap: 8px; }
    .oracle-icon { font-size: 3rem; }
    .empty-state h3 { color: #f5f0ff; margin: 8px 0 4px; }
    .suggestions { display: flex; flex-wrap: wrap; gap: 8px; justify-content: center; margin-top: 12px; }
    .suggestion-chip {
      background: rgba(94, 207, 255, 0.1); border: 1px solid rgba(94, 207, 255, 0.3);
      color: #5ecfff; padding: 8px 16px; border-radius: 20px; cursor: pointer; font-size: 0.85rem;
      transition: all 0.2s;
      &:hover { background: rgba(94, 207, 255, 0.2); }
    }

    .message { display: flex; gap: 8px; max-width: 85%; }
    .message.user { align-self: flex-end; flex-direction: row-reverse; }
    .message.assistant { align-self: flex-start; }
    .avatar { width: 32px; height: 32px; border-radius: 50%; background: rgba(168, 85, 247, 0.2); display: flex; align-items: center; justify-content: center; font-size: 1rem; flex-shrink: 0; }
    .bubble { border-radius: 16px; padding: 10px 14px; line-height: 1.5; font-size: 0.9rem; }
    .message.user .bubble { background: rgba(94, 207, 255, 0.15); color: #e0f0ff; border-bottom-right-radius: 4px; }
    .message.assistant .bubble { background: rgba(168, 85, 247, 0.12); color: #f0e6ff; border-bottom-left-radius: 4px; }
    .bubble-content { white-space: pre-wrap; word-break: break-word; }
    .cursor { animation: blink 1s step-end infinite; }
    @keyframes blink { 50% { opacity: 0; } }

    .input-area { padding: 12px 0 24px; }
    .input-wrapper { display: flex; gap: 8px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 24px; padding: 4px 4px 4px 16px; }
    .chat-input {
      flex: 1; background: transparent; border: none; outline: none;
      color: #f5f0ff; font-size: 0.95rem; padding: 8px 0;
      &::placeholder { color: #6b7280; }
    }
    .send-btn {
      width: 40px; height: 40px; border-radius: 50%; border: none;
      background: linear-gradient(135deg, #5ecfff, #a855f7); color: white;
      font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      transition: opacity 0.2s;
      &:disabled { opacity: 0.4; cursor: not-allowed; }
      &:hover:not(:disabled) { opacity: 0.85; }
    }
  `],
})
export class AiChatPageComponent implements AfterViewChecked {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  @ViewChild('messagesArea') messagesArea!: ElementRef;

  messages = signal<ChatMessage[]>([]);
  streaming = signal(false);
  streamingText = signal('');
  inputText = '';
  conversationId: string | undefined;

  suggestions = [
    '💪 Create a workout plan',
    '🥗 Plan my meals this week',
    '⏰ Remind me to stretch at 3pm',
    '📊 How was my day?',
  ];

  ngAfterViewChecked() {
    this.scrollToBottom();
  }

  sendMessage(text: string) {
    if (!text.trim() || this.streaming()) return;
    this.inputText = '';

    const userMsg: ChatMessage = { role: 'user', content: text.trim(), timestamp: new Date() };
    this.messages.update(msgs => [...msgs, userMsg]);

    this.streaming.set(true);
    this.streamingText.set('');

    let fullResponse = '';

    this.api.chatStream(text.trim(), this.conversationId).subscribe({
      next: (chunk) => {
        fullResponse += chunk;
        this.streamingText.set(fullResponse);
      },
      error: () => {
        this.streaming.set(false);
        const errMsg: ChatMessage = { role: 'assistant', content: 'Sorry, something went wrong. Please try again.', timestamp: new Date() };
        this.messages.update(msgs => [...msgs, errMsg]);
      },
      complete: () => {
        this.streaming.set(false);
        const assistantMsg: ChatMessage = { role: 'assistant', content: fullResponse || 'No response received.', timestamp: new Date() };
        this.messages.update(msgs => [...msgs, assistantMsg]);
      }
    });
  }

  onTabChanged(tab: NavTab) {
    const routes: Record<string, string> = {
      spread: '/spread', chat: '/chat', tasks: '/tasks',
      goals: '/goals', profile: '/profile', today: '/checkin',
    };
    this.router.navigate([routes[tab] || '/spread']);
  }

  private scrollToBottom() {
    try {
      this.messagesArea?.nativeElement?.scrollTo({ top: this.messagesArea.nativeElement.scrollHeight, behavior: 'smooth' });
    } catch {}
  }
}
