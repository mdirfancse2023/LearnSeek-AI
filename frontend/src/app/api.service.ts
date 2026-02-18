import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private API = 'http://localhost:8000';

  async loadYoutube(url: string) {
    console.log('Sending:', { url });

    const res = await fetch(`${this.API}/load-youtube`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!res.ok) throw new Error('Load failed');
    return res.json();
  }

  async askAI(query: string) {
    const res = await fetch(`${this.API}/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    });

    if (!res.ok) throw new Error('Ask failed');
    return res.json();
  }

  async resetAll() {
    await fetch(`${this.API}/reset`, { method: 'POST' });
  }

  async checkStatus() {
    const res = await fetch('http://localhost:8000/status');
    return res.json();
  }
}