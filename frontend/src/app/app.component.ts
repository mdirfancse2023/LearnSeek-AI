import { Component, OnInit, Inject, Renderer2 } from '@angular/core';
import { ToolbarComponent } from './toolbar.component';
import { ChatComponent } from './chat.component';
import { ApiService } from './api.service';
import { DOCUMENT } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToolbarComponent, ChatComponent],
  template: `
    <div class="app-container">
      <div class="header">
        <h1>LearnSeek AI</h1>
        <button class="theme-toggle" (click)="toggleTheme()">
          {{ isDarkMode ? '☀️' : '🌙' }}
        </button>
      </div>
      <app-toolbar
        (onReady)="onReady()"
        (onReset)="onReset()"
        [chatActive]="chatActive"
      ></app-toolbar>
      <app-chat
        (onUserMessage)="handleUserMessage()"
        [enabled]="ready"
        [resetKey]="resetKey"
      ></app-chat>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
      background: var(--bg-color);
      transition: background 0.3s;
    }

    .app-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 0 1rem;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1rem 0;
      border-bottom: 1px solid var(--border-color);
    }

    h1 {
      margin: 0;
      font-size: 1.5rem;
      color: var(--text-color);
    }

    .theme-toggle {
      background: var(--button-bg);
      color: white;
      border: none;
      padding: 0.5rem;
      border-radius: 50%;
      cursor: pointer;
      font-size: 1.2rem;
      transition: background 0.3s;
      width: 40px;
      height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .theme-toggle:hover {
      background: var(--button-hover);
    }

    @media (max-width: 768px) {
      .app-container {
        padding: 0 0.5rem;
      }

      .header {
        padding: 0.5rem 0;
      }

      h1 {
        font-size: 1.2rem;
      }

      .theme-toggle {
        width: 35px;
        height: 35px;
        font-size: 1rem;
      }
    }
  `]
})
export class AppComponent implements OnInit {
  ready = false;
  resetKey = 0;
  isDarkMode = false;
  chatActive = false;

  constructor(
    private apiService: ApiService,
    private renderer: Renderer2,
    @Inject(DOCUMENT) private document: Document
  ) {}

  ngOnInit() {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
    this.applyTheme();
    this.checkStatus();
  }

  applyTheme() {
    if (this.isDarkMode) {
      this.renderer.addClass(this.document.body, 'dark');
    } else {
      this.renderer.removeClass(this.document.body, 'dark');
    }
  }

  toggleTheme() {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  async checkStatus() {
    try {
      const res = await this.apiService.checkStatus();
      if (res.ready) this.ready = true;
    } catch (e) {
      console.error(e);
    }
  }

  onReady() {
    this.ready = true;
  }

  onReset() {
    this.ready = false;
    this.resetKey++;
    this.chatActive = false;
  }

  handleUserMessage() {
    // user started chatting locally — mark chat active so toolbar hides "Ready to chat"
    this.chatActive = true;
  }
}
