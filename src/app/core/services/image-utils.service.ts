import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ImageUtilsService {

  constructor() { }

  /**
   * Obtiene la URL completa de una imagen de producto
   */
  getProductImageUrl(imageUrl?: string): string {
    if (imageUrl) {
      // Si la URL es relativa, construir URL completa
      if (imageUrl.startsWith('/')) {
        return `https://efresco-backend.onrender.com${imageUrl}`;
      }
      // Si ya es una URL completa, usarla directamente
      return imageUrl;
    }

    // Fallback a placeholder de producto
    return '/assets/images/producto-placeholder.svg';
  }

  /**
   * Obtiene la URL completa de una imagen de usuario
   */
  getUserImageUrl(imageUrl?: string): string {
    if (imageUrl) {
      // Si la URL es relativa, construir URL completa
      if (imageUrl.startsWith('/')) {
        return `https://efresco-backend.onrender.com${imageUrl}`;
      }
      // Si ya es una URL completa, usarla directamente
      return imageUrl;
    }

    // Fallback a placeholder de usuario
    return '/assets/images/user-placeholder.svg';
  }

  /**
   * Maneja errores de carga de imagen estableciendo un fallback
   */
  onImageError(event: Event, fallbackUrl: string): void {
    const target = event.target as HTMLImageElement;
    if (target && target.src !== fallbackUrl) {
      target.src = fallbackUrl;
    }
  }

  /**
   * Maneja errores específicos de imágenes de productos
   */
  onProductImageError(event: Event): void {
    this.onImageError(event, '/assets/images/producto-placeholder.svg');
  }

  /**
   * Maneja errores específicos de imágenes de usuarios
   */
  onUserImageError(event: Event): void {
    this.onImageError(event, '/assets/images/user-placeholder.svg');
  }
}
