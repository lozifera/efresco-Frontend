import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-chat-drawer',
  standalone: true,
  template: `
    <div class="chat-drawer-backdrop" (click)="closeDrawer()"></div>
    <div class="chat-drawer-panel">
      <ng-content></ng-content>
      <button class="close-btn" (click)="closeDrawer()">✖</button>
    </div>
  `,
  styles: [`
    .chat-drawer-backdrop {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.3);
      z-index: 1000;
    }
    .chat-drawer-panel {
      position: fixed;
      top: 0; right: 0;
      width: 400px;
      height: 100vh;
      background: #fff;
      box-shadow: -2px 0 8px rgba(0,0,0,0.1);
      z-index: 1001;
      display: flex;
      flex-direction: column;
    }
    .close-btn {
      position: absolute;
      top: 10px; right: 10px;
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
    }
  `]
})
export class ChatDrawerComponent {
  @Output() closed = new EventEmitter<void>();
  closeDrawer() {
    this.closed.emit();
  }
}
