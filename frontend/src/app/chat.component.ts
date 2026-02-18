import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef, ViewChild, ElementRef, Output, EventEmitter } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

interface Message {
  role: 'user' | 'ai';
  text: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="chat" [class.disabled]="!enabled">
      <div class="messages" #messagesContainer>

        @for (message of messages; track $index) {
          <div [class]="message.role">
            <div class="message-body" [innerHTML]="formatMessage(message.text)"></div>
          </div>
        }

        @if (thinking) {
          <div class="ai">🤖 Thinking…</div>
        }
      </div>

      <div class="input">
        <input
          [disabled]="!enabled"
          [(ngModel)]="input"
          (keydown.enter)="send()"
          placeholder="Ask about the video…"
        />
        <button (click)="send()" [disabled]="!enabled">Ask</button>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
      height: 100%;
    }

    .chat {
      display: flex;
      flex-direction: column;
      background: var(--bg-color);
      width: 100%;
      min-height: 0;
      flex: 1 1 auto;
    }

    .chat.disabled {
      opacity: 0.4;
    }

    .messages {
      flex: 1 1 auto;
      display: flex;
      flex-direction: column;
      padding: 1rem;
      overflow-y: auto;
      max-height: calc(100vh - 200px);
      gap: 0.5rem;
      /* leave space for the sticky input */
      padding-bottom: 6rem;
      /* hide native scrollbar but keep scrolling */
      -ms-overflow-style: none; /* IE and Edge */
      scrollbar-width: none; /* Firefox */
    }

    .messages::-webkit-scrollbar { width: 0; height: 0; }

    .messages > div {
      margin-bottom: 1rem;
      padding: 0.75rem;
      border-radius: 0.5rem;
      max-width: 80%;
      word-wrap: break-word;
    }

    .user {
      background: rgba(59,130,246,0.06);
      color: var(--text-color);
      margin-left: auto;
      text-align: left;
      border: 1px solid rgba(59,130,246,0.12);
    }

    .ai {
      background: rgba(15,23,42,0.06);
      color: var(--text-color);
      border: 1px solid rgba(15,23,42,0.08);
    }

    .message-body {
      white-space: pre-wrap;
      line-height: 1.45;
    }

    pre {
      background: rgba(2,6,23,0.75);
      color: #e6eef8;
      padding: 0.75rem;
      border-radius: 8px;
      overflow: auto;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;
      font-size: 0.9rem;
      margin: 0.5rem 0;
    }

    code {
      background: rgba(2,6,23,0.4);
      padding: 0.15rem 0.35rem;
      border-radius: 6px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, 'Roboto Mono', 'Courier New', monospace;
      font-size: 0.92rem;
    }

    .input {
      display: flex;
      gap: 0.75rem;
      padding: 0.75rem 1rem;
      margin: 0.5rem 0 0.75rem 0;
      border-radius: 12px;
      border: 1px solid rgba(0,0,0,0.06);
      box-shadow: 0 6px 18px rgba(2,6,23,0.06);
      background: var(--secondary-bg);
      position: sticky;
      bottom: 0.75rem;
      z-index: 20;
      align-items: center;
    }

    input {
      flex: 1;
      padding: 0.75rem 0.75rem;
      background: var(--input-bg);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      font-size: 1rem;
    }

    input::placeholder {
      color: var(--text-color);
      opacity: 0.6;
    }

    button {
      padding: 0.75rem 1rem;
      background: var(--button-bg);
      color: white;
      border: none;
      border-radius: 0.5rem;
      cursor: pointer;
      font-weight: 500;
      transition: background 0.3s;
    }

    button:hover:not(:disabled) {
      background: var(--button-hover);
    }

    button:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    @media (max-width: 768px) {
      .messages {
        padding: 0.75rem;
        max-height: calc(100vh - 250px);
      }

      .messages > div {
        max-width: 90%;
      }

      .input {
        padding: 0.75rem;
        flex-direction: column;
      }

      input {
        padding: 0.625rem;
      }

      button {
        padding: 0.625rem;
      }
    }
  `]
})
export class ChatComponent implements OnChanges {
  @Input() enabled = false;
  @Input() resetKey = 0;
  @Output() onUserMessage = new EventEmitter<void>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef<HTMLDivElement>;

  messages: Message[] = [];
  input = '';
  thinking = false;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef, private sanitizer: DomSanitizer) {}

  formatMessage(text: string): SafeHtml {
    if (!text) return '' as unknown as SafeHtml;
    // escape HTML
    const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // handle code fences ```
    let out = esc(text);
    out = out.replace(/```([\s\S]*?)```/g, (_m, p1) => {
      return '<pre><code>' + esc(p1) + '</code></pre>';
    });

    // inline code `code`
    out = out.replace(/`([^`]+)`/g, (_m, p1) => `<code>${esc(p1)}</code>`);

    // bold **text**
    out = out.replace(/\*\*([^*]+)\*\*/g, (_m, p1) => `<strong>${esc(p1)}</strong>`);

    // paragraphs: double newline -> paragraph
    out = out.split('\n\n').map(p => p.replace(/\n/g, '<br>')).join('<p></p>');

    return this.sanitizer.bypassSecurityTrustHtml(out);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetKey']) {
      this.messages = [];
      this.input = '';
      this.thinking = false;
      // reset scroll
      setTimeout(() => this.scrollToBottom(), 0);
    }
  }

  async send() {
    if (!this.enabled || !this.input.trim()) return;

    this.messages.push({ role: 'user', text: this.input });
    // emit user activity when first message is sent
    if (this.messages.filter(m => m.role === 'user').length === 1) {
      this.onUserMessage.emit();
    }
    const query = this.input;
    this.input = '';
    this.thinking = true;
    this.cdr.detectChanges();
    // scroll so the user's message and input remain visible
    this.scrollToBottom();

    try {
      const res = await this.apiService.askAI(query);
      this.messages.push({ role: 'ai', text: res.answer });
      this.cdr.detectChanges();
      this.scrollToBottom();
    } catch (e) {
      console.error(e);
      this.messages.push({ role: 'ai', text: 'Error occurred' });
      this.cdr.detectChanges();
      this.scrollToBottom();
    } finally {
      this.thinking = false;
      this.cdr.detectChanges();
    }
  }

  private scrollToBottom() {
    try {
      const el = this.messagesContainer?.nativeElement;
      if (!el) return;
      // small timeout to ensure DOM updated
      setTimeout(() => {
        el.scrollTop = el.scrollHeight;
      }, 50);
    } catch (err) {
      // ignore
    }
  }
}