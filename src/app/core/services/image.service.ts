import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

@Injectable({
  providedIn: 'root'
})
export class ImageService {
  private imageCache = new Map<string, string>();

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  /**
   * Obtiene una imagen usando fetch con headers CORS optimizados
   * Solución más robusta y compatible
   */
  getImageAsBlob(imageUrl: string): Observable<string | null> {
    if (!imageUrl) {
      return of(null);
    }

    // Verificar si la imagen ya está en caché
    if (this.imageCache.has(imageUrl)) {
      return of(this.imageCache.get(imageUrl)!);
    }

    // Usar fetch para mejor control de CORS
    return new Observable(observer => {
      this.fetchImageWithCORS(imageUrl)
        .then(objectUrl => {
          if (objectUrl) {
            this.imageCache.set(imageUrl, objectUrl);
          }
          observer.next(objectUrl);
          observer.complete();
        })
        .catch(error => {
          console.error('Error loading image:', error);
          observer.next(null);
          observer.complete();
        });
    });
  }

  /**
   * Fetch optimizado para imágenes - sin headers custom para evitar preflight
   */
  private async fetchImageWithCORS(imageUrl: string): Promise<string | null> {
    try {
      // Intentar primero con la URL original
      let response = await fetch(imageUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'default',
        credentials: 'omit'  // No enviar cookies para evitar problemas de CORS
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      // Si falla, intentar con un proxy CORS alternativo
      const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(imageUrl)}`;
      response = await fetch(proxyUrl, {
        method: 'GET',
        mode: 'cors',
        cache: 'default',
        credentials: 'omit'
      });

      if (response.ok) {
        const blob = await response.blob();
        return URL.createObjectURL(blob);
      }

      // No logear errores 404 ya que son esperados para imágenes no encontradas
      if (response.status !== 404) {
        console.warn(`Failed to fetch image: ${response.status}`);
      }
      return null;

    } catch (error) {
      // Solo logear errores que no sean de red (404, CORS, etc.)
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Error de red, normal para imágenes no encontradas
      } else {
        console.warn('Failed to fetch image:', error);
      }

      // Fallback: devolver una imagen placeholder
      return this.generatePlaceholderImage(imageUrl);
    }
  }

  /**
   * Genera una imagen placeholder cuando falla la carga
   */
  generatePlaceholderImage(originalUrl: string): string {
    try {
      // Extraer texto para el placeholder
      const filename = originalUrl.split('/').pop() || 'IMG';
      const text = filename.substring(0, 2).toUpperCase();

      // Crear canvas con placeholder
      const canvas = document.createElement('canvas');
      canvas.width = 200;
      canvas.height = 200;
      const ctx = canvas.getContext('2d');

      if (ctx) {
        // Background gradient
        const gradient = ctx.createLinearGradient(0, 0, 200, 200);
        gradient.addColorStop(0, '#e5e7eb');
        gradient.addColorStop(1, '#d1d5db');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, 200, 200);

        // Texto
        ctx.fillStyle = '#6b7280';
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(text, 100, 120);

        return canvas.toDataURL('image/png');
      }
    } catch (e) {
      console.warn('Error creating placeholder:', e);
    }

    // Fallback absoluto - imagen placeholder desde servicio externo
    return 'https://via.placeholder.com/200x200/e5e7eb/6b7280?text=IMG';
  }

  /**
   * Obtiene una imagen como SafeUrl para usar en templates
   */
  getImageAsSafeUrl(imageUrl: string): Observable<SafeUrl | null> {
    return this.getImageAsBlob(imageUrl).pipe(
      map((blobUrl: string | null) => blobUrl ? this.sanitizer.bypassSecurityTrustUrl(blobUrl) : null)
    );
  }

  /**
   * Limpia el caché de imágenes para liberar memoria
   */
  clearImageCache(): void {
    this.imageCache.forEach(url => {
      URL.revokeObjectURL(url);
    });
    this.imageCache.clear();
  }

  /**
   * Elimina una imagen específica del caché
   */
  removeFromCache(imageUrl: string): void {
    const cachedUrl = this.imageCache.get(imageUrl);
    if (cachedUrl) {
      URL.revokeObjectURL(cachedUrl);
      this.imageCache.delete(imageUrl);
    }
  }

  /**
   * Verifica si una URL es una imagen del backend de eFresco
   */
  iseFrescoImage(url: string): boolean {
    return !!(url && url.includes('efresco-backend.onrender.com/uploads'));
  }

  /**
   * Normaliza la URL de imagen para evitar problemas de CORS
   */
  normalizeImageUrl(url: string): string {
    if (!url) return url;

    // Si es una imagen de eFresco con HTTP, cambiar a HTTPS
    if (url.startsWith('http://efresco-backend.onrender.com')) {
      return url.replace('http://', 'https://');
    }

    return url;
  }

  /**
   * Obtiene una URL proxy para evitar problemas de CORS
   */
  getProxyImageUrl(originalUrl: string): string {
    if (!this.iseFrescoImage(originalUrl)) {
      return originalUrl;
    }

    // Estrategia alternativa: usar la URL directa pero normalizada
    const normalizedUrl = this.normalizeImageUrl(originalUrl);

    // Si sigue fallando, podríamos implementar un proxy propio
    // o usar un servicio de proxy público como:
    // return `https://images.weserv.nl/?url=${encodeURIComponent(normalizedUrl)}`;

    return normalizedUrl;
  }  /**
   * Headers para solicitudes de imágenes
   */
  private getImageHeaders(): HttpHeaders {
    const token = localStorage.getItem('efresco_token');
    const headers: any = {
      'Accept': 'image/*'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }
}
