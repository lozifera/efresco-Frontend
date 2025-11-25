import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-image-fallback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="image-fallback">
      <div class="placeholder-content">
        <svg
          class="placeholder-icon"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width="1"
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
        </svg>
        <span class="placeholder-text">{{ text || 'Imagen no disponible' }}</span>
      </div>
    </div>
  `,
  styles: [`
    .image-fallback {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
      border-radius: 8px;
      min-height: 200px;
    }

    .placeholder-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 20px;
      text-align: center;
    }

    .placeholder-icon {
      width: 48px;
      height: 48px;
      color: #9ca3af;
    }

    .placeholder-text {
      color: #6b7280;
      font-size: 14px;
      font-weight: 500;
    }
  `]
})
export class ImageFallbackComponent {
  text?: string;
}
