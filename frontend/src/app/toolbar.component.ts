import { Component, EventEmitter, Output, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
        <p class="status">⏳ {{ message }}</p>

        <div class="log" #logContainer>
          @for (line of revLog; track $index) {
            <div class="log-line">{{ line }}</div>
          }
        </div>
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
      padding: 1rem;
      border-bottom: 1px solid var(--border-color);
      background: var(--secondary-bg);
    }

    .row {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }

    input {
      flex: 1;
      padding: 0.75rem;
      background: var(--input-bg);
      color: var(--text-color);
      border: 1px solid var(--border-color);
      border-radius: 0.5rem;
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

    button.reset {
      background: #ef4444;
    }

    button.reset:hover:not(:disabled) {
      background: #dc2626;
    }

    .status {
      margin: 0;
      font-size: 0.9rem;
      font-weight: 500;
    }

    .log {
      margin-top: 0.5rem;
      max-height: 160px;
      overflow-y: auto;
      padding: 0.5rem;
      border-radius: 0.5rem;
      background: rgba(0,0,0,0.03);
      border: 1px solid var(--border-color);
    }

    .log-line {
      font-size: 0.85rem;
      color: var(--text-color);
      opacity: 0.9;
      padding: 2px 0;
      border-bottom: 1px dashed rgba(0,0,0,0.04);
    }

    .ok { color: #22c55e; }
    .err { color: #ef4444; }

    @media (max-width: 768px) {
      .topbar {
        padding: 0.75rem;
      }

      .row {
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
export class ToolbarComponent implements OnDestroy {
  url = '';
  status: string = 'idle';
  message: string = '';
  log: string[] = [];
  
  // expose reversed log so newest entries appear at top
  get revLog() {
    return [...this.log].reverse();
  }

  // reference to the log container to adjust scroll position
  logEl: HTMLElement | null = null;

  private pollInterval: any;

  @Output() onReady = new EventEmitter<void>();
  @Output() onReset = new EventEmitter<void>();

  constructor(private apiService: ApiService, private cdr: ChangeDetectorRef) {}

  ngOnDestroy() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }
  }

  async start() {
    if (!this.url.trim()) return;

    this.status = 'loading';
    this.message = 'Starting...';
    this.startPolling();

    try {
      await this.apiService.loadYoutube(this.url);
      this.status = 'ready';
      this.message = 'Ready to chat';
      this.stopPolling();
      this.onReady.emit();
    } catch (e) {
      console.error(e);
      this.status = 'error';
      this.message = 'Failed';
      this.stopPolling();
    }
  }

  private startPolling() {
    this.pollInterval = setInterval(async () => {
      try {
        const res = await this.apiService.checkStatus();
        this.status = res.status;
        this.message = res.message;
        this.log = res.log || [];
        this.cdr.detectChanges();
        // ensure newest messages are visible at top
        try {
          if (!this.logEl) {
            this.logEl = document.querySelector('.log');
          }
          if (this.logEl) {
            this.logEl.scrollTop = 0;
          }
        } catch (e) {}
        if (res.status === 'ready') {
          this.stopPolling();
          this.onReady.emit();
        }
      } catch (e) {
        console.error(e);
      }
    }, 1000);
  }

  private stopPolling() {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }

  async reset() {
    await this.apiService.resetAll();
    this.url = '';
    this.status = 'idle';
    this.message = '';
    this.stopPolling();
    this.onReset.emit();
  }
}