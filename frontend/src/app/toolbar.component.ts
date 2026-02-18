import { Component, EventEmitter, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ApiService } from './api.service';

@Component({
  selector: 'app-toolbar',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="topbar">
      <div class="row">
        <input
          type="text"
          placeholder="Paste YouTube video or playlist URL"
          [(ngModel)]="url"
          [disabled]="status === 'loading'"
        />

        <button (click)="start()" [disabled]="status === 'loading'">
          Load
        </button>

        <button class="reset" (click)="reset()">
          Reset
        </button>
      </div>

      @if (status === 'loading') {
        <p class="status">⏳ Processing…</p>
      }
      @if (status === 'ready') {
        <p class="status ok">✅ Ready to chat</p>
      }
      @if (status === 'error') {
        <p class="status err">❌ Failed</p>
      }
    </div>
  `,
  styles: [`
    .topbar {
      padding: 12px;
      border-bottom: 1px solid #334155;
    }

    .row {
      display: flex;
      gap: 8px;
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

    button.reset {
      background: #ef4444;
    }

    .status { margin-top: 6px; }
    .ok { color: #22c55e; }
    .err { color: #ef4444; }
  `]
})
export class ToolbarComponent {
  url = '';
  status: 'idle' | 'loading' | 'ready' | 'error' = 'idle';

  @Output() onReady = new EventEmitter<void>();
  @Output() onReset = new EventEmitter<void>();

  constructor(private apiService: ApiService) {}

  async start() {
    if (!this.url.trim()) return;

    this.status = 'loading';
    try {
      await this.apiService.loadYoutube(this.url);
      this.status = 'ready';
      this.onReady.emit();
    } catch (e) {
      console.error(e);
      this.status = 'error';
    }
  }

  async reset() {
    await this.apiService.resetAll();
    this.url = '';
    this.status = 'idle';
    this.onReset.emit();
  }
}