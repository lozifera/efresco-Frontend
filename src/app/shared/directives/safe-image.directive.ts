import { Directive, ElementRef, Input, OnDestroy, OnInit, Renderer2, inject } from '@angular/core';
import { Subscription } from 'rxjs';
import { ImageService } from '../../core/services/image.service';

@Directive({
  selector: '[safeImage], [appSafeImage]',
  standalone: true
})
export class SafeImageDirective implements OnInit, OnDestroy {
  @Input('safeImage') imageUrl?: string;
  @Input('appSafeImage') set appImageUrl(value: string | undefined) {
    this.imageUrl = value;
  }
  @Input() fallbackSrc?: string;
  @Input() errorClass = 'image-error';
  @Input() loadingClass = 'image-loading';

  private el = inject(ElementRef);
  private renderer = inject(Renderer2);
  private imageService = inject(ImageService);
  private subscription?: Subscription;

  ngOnInit() {
    if (!this.imageUrl) {
      this.setFallbackImage();
      return;
    }

    // Añadir clase de carga
    this.renderer.addClass(this.el.nativeElement, this.loadingClass);

    // Intentar cargar la imagen
    this.loadImage();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  private loadImage() {
    if (!this.imageUrl) {
      this.setFallbackImage();
      return;
    }

    // Primero intentar carga directa
    this.tryDirectLoad(this.imageUrl).then(success => {
      if (success) {
        this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
      } else {
        // Si falla, usar el servicio de imágenes
        this.loadWithService();
      }
    });
  }

  private tryDirectLoad(url: string): Promise<boolean> {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        this.setImageSrc(url);
        resolve(true);
      };
      img.onerror = () => {
        resolve(false);
      };
      img.src = url;
    });
  }

  private loadWithService() {
    if (!this.imageUrl) {
      this.setFallbackImage();
      return;
    }

    this.subscription = this.imageService.getImageAsBlob(this.imageUrl).subscribe({
      next: (blobUrl: string | null) => {
        this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
        if (blobUrl) {
          this.setImageSrc(blobUrl);
        } else {
          this.setFallbackImage();
        }
      },
      error: () => {
        this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
        this.setFallbackImage();
      }
    });
  }

  private setImageSrc(src: string) {
    this.renderer.setAttribute(this.el.nativeElement, 'src', src);
    this.renderer.removeClass(this.el.nativeElement, this.errorClass);
  }

  private setFallbackImage() {
    this.renderer.addClass(this.el.nativeElement, this.errorClass);

    if (this.fallbackSrc) {
      this.setImageSrc(this.fallbackSrc);
    } else {
      // Usar el placeholder del servicio de imágenes
      const placeholder = this.imageService.generatePlaceholderImage(this.imageUrl || '');
      this.setImageSrc(placeholder);
    }

    this.renderer.removeClass(this.el.nativeElement, this.loadingClass);
  }
}
