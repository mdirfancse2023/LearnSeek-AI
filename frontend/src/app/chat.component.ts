import { Component, Input, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
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
      <div class="messages">
        @if (!enabled) {
          <p class="hint">Load a YouTube link to start</p>
        }

        @for (message of messages; track $index) {
          <div [class]="message.role">
            {{ message.text }}
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
    .chat {
      height: calc(100vh - 120px);
      display: flex;
      flex-direction: column;
    }

    .chat.disabled {
      opacity: 0.4;
    }

    .messages {
      flex: 1;
      padding: 12px;
      overflow-y: auto;
    }

    .user { text-align: right; color: #93c5fd; }
    .ai { color: #a7f3d0; }

    .input {
      display: flex;
      gap: 8px;
      padding: 10px;
    }

    input {
      flex: 1;
      padding: 10px;
      background: #020617;
      color: white;
      border: 1px solid #334155;
    }

    button {
      padding: 10px 14px;
      background: #22c55e;
      border: none;
      cursor: pointer;
      font-weight: bold;
    }
  `]
})
export class ChatComponent implements OnChanges {
  @Input() enabled = false;
  @Input() resetKey = 0;

  messages: Message[] = [];
  input = '';
  thinking = false;

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnChanges(changes: SimpleChanges) {
    if (changes['resetKey']) {
      this.messages = [];
      this.input = '';
      this.thinking = false;
    }
  }

  async send() {
    if (!this.enabled || !this.input.trim()) return;

    this.messages.push({ role: 'user', text: this.input });
    const query = this.input;
    this.input = '';
    this.thinking = true;
    this.cdr.detectChanges();

    try {
      const res = await this.apiService.askAI(query);
      this.messages.push({ role: 'ai', text: res.answer });
      this.cdr.detectChanges();
    } catch (e) {
      console.error(e);
      this.messages.push({ role: 'ai', text: 'Error occurred' });
      this.cdr.detectChanges();
    } finally {
      this.thinking = false;
      this.cdr.detectChanges();
    }
  }
}