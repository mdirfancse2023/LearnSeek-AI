import { Component, OnInit } from '@angular/core';
import { ToolbarComponent } from './toolbar.component';
import { ChatComponent } from './chat.component';
import { ApiService } from './api.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [ToolbarComponent, ChatComponent],
  template: `
    <app-toolbar
      (onReady)="onReady()"
      (onReset)="onReset()"
    ></app-toolbar>
    <app-chat
      [enabled]="ready"
      [resetKey]="resetKey"
    ></app-chat>
  `,
  styles: [`
    :host {
      display: block;
      height: 100vh;
    }
  `]
})
export class AppComponent implements OnInit {
  ready = false;
  resetKey = 0;

  constructor(private apiService: ApiService) {}

  ngOnInit() {
    this.checkStatus();
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
  }
}
