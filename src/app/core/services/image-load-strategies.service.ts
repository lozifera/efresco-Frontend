import { Injectable } from '@angular/core';

export interface ImageLoadStrategy {
  name: string;
  transformUrl: (url: string) => string;
  priority: number;
}

@Injectable({
  providedIn: 'root'
})
export class ImageLoadStrategies {
  private readonly strategies: ImageLoadStrategy[] = [
    {
      name: 'https-conversion',
      transformUrl: (url: string) => url.replace('http://', 'https://'),
      priority: 1
    },
    {
      name: 'direct-load',
      transformUrl: (url: string) => url,
      priority: 2
    },
    {
      name: 'cors-anywhere-proxy',
      transformUrl: (url: string) => {
        // Solo usar proxy para URLs problemáticas
        if (url.includes('efresco-backend.onrender.com')) {
          return `https://cors-anywhere.herokuapp.com/${url}`;
        }
        return url;
      },
      priority: 3
    },
    {
      name: 'weserv-proxy',
      transformUrl: (url: string) => {
        if (url.includes('efresco-backend.onrender.com')) {
          return `https://images.weserv.nl/?url=${encodeURIComponent(url)}`;
        }
        return url;
      },
      priority: 4
    }
  ];

  getStrategies(): ImageLoadStrategy[] {
    return [...this.strategies].sort((a, b) => a.priority - b.priority);
  }

  async tryLoadWithStrategies(originalUrl: string): Promise<string | null> {
    const strategies = this.getStrategies();

    for (const strategy of strategies) {
      try {
        const transformedUrl = strategy.transformUrl(originalUrl);
        const success = await this.testImageLoad(transformedUrl);

        if (success) {
          console.log(`Image loaded successfully with strategy: ${strategy.name}`);
          return transformedUrl;
        }
      } catch (error) {
        console.log(`Strategy ${strategy.name} failed:`, error);
        continue;
      }
    }

    return null;
  }

  private testImageLoad(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();

      img.onload = () => resolve(true);
      img.onerror = () => resolve(false);

      // Timeout para evitar cuelgues
      setTimeout(() => resolve(false), 3000);

      img.src = url;
    });
  }
}
