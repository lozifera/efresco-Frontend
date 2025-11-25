import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { finalize } from 'rxjs/operators';

import { FavoritosService, Favorito, FavoritosListResponse } from '../../core/services/favoritos.service';
import { SafeImageDirective } from '../../shared/directives/safe-image.directive';
import { BotonFavoritoComponent } from '../../shared/components/boton-favorito.component';

@Component({
  selector: 'app-favoritos',
  standalone: true,
  imports: [CommonModule, RouterModule, SafeImageDirective, BotonFavoritoComponent],
  template: `
    <div class="favoritos-container">
      <div class="header">
        <h2><i class="fas fa-heart"></i> Mis Favoritos</h2>
        <p class="subtitle">Productos y anuncios que te interesan</p>
      </div>

      <!-- Lista de favoritos -->
      <div class="favoritos-content" *ngIf="!cargando">

        <!-- Sección de productos favoritos -->
        <div class="seccion-favoritos" *ngIf="productosFavoritos.length > 0">
          <h3 class="seccion-titulo">
            <i class="fas fa-leaf"></i>
            Productos Favoritos ({{ productosFavoritos.length }})
          </h3>

          <div class="favoritos-grid">
            <div class="favorito-card producto-card" *ngFor="let favorito of productosFavoritos">
              <div class="favorito-header">
                <span class="favorito-fecha">
                  <i class="fas fa-calendar"></i>
                  {{ getFechaFormateada(favorito.fecha_agregado) }}
                </span>
                <app-boton-favorito
                  [idProducto]="favorito.producto!.id"
                  [soloIcono]="true"
                  [tamaño]="'sm'"
                  (favoritoToggled)="onFavoritoToggled($event)"
                  (error)="onFavoritoError($event)"
                ></app-boton-favorito>
              </div>

              <div class="favorito-imagen">
                <img
                  [src]="favorito.producto!.imagen_url"
                  [alt]="favorito.producto!.nombre"
                  appSafeImage
                  (error)="onImageError($event)"
                >
              </div>

              <div class="favorito-info">
                <h4 class="producto-nombre">{{ favorito.producto!.nombre }}</h4>
                <p class="producto-descripcion" *ngIf="favorito.producto!.descripcion">
                  {{ favorito.producto!.descripcion }}
                </p>

                <div class="producto-precio">
                  <span class="precio-valor">
                    $ {{ favorito.producto!.precio_referencial | number:'1.2-2' }}
                  </span>
                  <span class="precio-unidad">/ {{ favorito.producto!.unidad_medida }}</span>
                </div>
              </div>

              <div class="favorito-acciones">
                <button
                  class="btn btn-primary btn-ver-producto"
                  [routerLink]="['/productos', favorito.producto!.id]"
                >
                  <i class="fas fa-eye"></i>
                  Ver Producto
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sección de anuncios de venta favoritos -->
        <div class="seccion-favoritos" *ngIf="anunciosVentaFavoritos.length > 0">
          <h3 class="seccion-titulo">
            <i class="fas fa-store"></i>
            Anuncios de Venta Favoritos ({{ anunciosVentaFavoritos.length }})
          </h3>

          <div class="favoritos-grid">
            <div class="favorito-card anuncio-card" *ngFor="let favorito of anunciosVentaFavoritos">
              <div class="favorito-header">
                <span class="favorito-fecha">
                  <i class="fas fa-calendar"></i>
                  {{ getFechaFormateada(favorito.fecha_agregado) }}
                </span>
                <app-boton-favorito
                  [idAnuncioVenta]="favorito.anuncio_venta!.id"
                  [soloIcono]="true"
                  [tamaño]="'sm'"
                  (favoritoToggled)="onFavoritoToggled($event)"
                  (error)="onFavoritoError($event)"
                ></app-boton-favorito>
              </div>

              <div class="favorito-imagen">
                <img
                  [src]="favorito.anuncio_venta!.producto.imagen_url"
                  [alt]="favorito.anuncio_venta!.producto.nombre"
                  appSafeImage
                  (error)="onImageError($event)"
                >
              </div>

              <div class="favorito-info">
                <h4 class="anuncio-producto">{{ favorito.anuncio_venta!.producto.nombre }}</h4>
                <p class="anuncio-descripcion" *ngIf="favorito.anuncio_venta!.descripcion">
                  {{ favorito.anuncio_venta!.descripcion }}
                </p>

                <div class="anuncio-detalles">
                  <div class="detalle-item">
                    <span class="label">Cantidad:</span>
                    <span class="value">
                      {{ favorito.anuncio_venta!.cantidad }} {{ favorito.anuncio_venta!.unidad }}
                    </span>
                  </div>

                  <div class="detalle-item">
                    <span class="label">Precio:</span>
                    <span class="value precio-anuncio">
                      $ {{ favorito.anuncio_venta!.precio | number:'1.2-2' }}
                      <small>/ {{ favorito.anuncio_venta!.producto.unidad_medida }}</small>
                    </span>
                  </div>

                  <div class="detalle-item" *ngIf="favorito.anuncio_venta!.ubicacion">
                    <span class="label">Ubicación:</span>
                    <span class="value">
                      <i class="fas fa-map-marker-alt"></i>
                      {{ favorito.anuncio_venta!.ubicacion }}
                    </span>
                  </div>

                  <div class="detalle-item" *ngIf="favorito.anuncio_venta!.vendedor">
                    <span class="label">Vendedor:</span>
                    <span class="value">
                      <i class="fas fa-user"></i>
                      {{ favorito.anuncio_venta!.vendedor.nombre }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="favorito-acciones">
                <button
                  class="btn btn-success btn-contactar"
                  *ngIf="favorito.anuncio_venta!.vendedor?.telefono"
                  (click)="contactarVendedorWhatsApp(favorito.anuncio_venta!)"
                >
                  <i class="fab fa-whatsapp"></i>
                  WhatsApp
                </button>

                <button
                  class="btn btn-primary btn-ver-anuncio"
                  routerLink="/anuncios/venta"
                >
                  <i class="fas fa-eye"></i>
                  Ver Anuncio
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Estado vacío -->
        <div class="empty-state" *ngIf="favoritos.length === 0 && !errorMensaje">
          <div class="empty-icon">
            <i class="fas fa-heart-broken"></i>
          </div>
          <h3>No tienes favoritos aún</h3>
          <p>Explora nuestros productos y anuncios para agregar tus favoritos</p>
          <div class="empty-actions">
            <button class="btn btn-primary" routerLink="/productos">
              <i class="fas fa-leaf"></i>
              Ver Productos
            </button>
            <button class="btn btn-outline-primary" routerLink="/anuncios/venta">
              <i class="fas fa-store"></i>
              Ver Anuncios
            </button>
          </div>
        </div>
      </div>

      <!-- Estado de carga -->
      <div class="loading-container" *ngIf="cargando">
        <div class="spinner"></div>
        <p>Cargando tus favoritos...</p>
      </div>

      <!-- Error -->
      <div class="alert alert-danger" *ngIf="errorMensaje">
        <h5><i class="fas fa-exclamation-triangle"></i> Error al cargar favoritos</h5>
        <p>{{ errorMensaje }}</p>
        <button class="btn btn-outline-danger btn-sm" (click)="cargarFavoritos()">Reintentar</button>
      </div>

      <!-- Toast de notificaciones -->
      <div class="toast" [class.show]="mostrarToastFlag" [ngClass]="tipoToast">
        <i class="fas" [ngClass]="{
          'fa-heart': tipoToast === 'success',
          'fa-heart-broken': tipoToast === 'error'
        }"></i>
        {{ mensajeToast }}
      </div>
    </div>
  `,
  styles: [`
    .favoritos-container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 2rem;
      position: relative;
    }

    .header {
      text-align: center;
      margin-bottom: 3rem;
    }

    .header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .header i {
      color: #e74c3c;
      margin-right: 0.5rem;
    }

    .subtitle {
      color: #7f8c8d;
      font-size: 1.1rem;
    }

    .seccion-favoritos {
      margin-bottom: 3rem;
    }

    .seccion-titulo {
      color: #2c3e50;
      margin-bottom: 1.5rem;
      font-size: 1.5rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      border-bottom: 3px solid #ecf0f1;
      padding-bottom: 0.5rem;
    }

    .seccion-titulo i {
      color: #27ae60;
    }

    .favoritos-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .favorito-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s, box-shadow 0.3s;
      border: 2px solid transparent;
    }

    .favorito-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
    }

    .producto-card:hover {
      border-color: #27ae60;
    }

    .anuncio-card:hover {
      border-color: #3498db;
    }

    .favorito-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }

    .favorito-fecha {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.8rem;
      color: #7f8c8d;
    }

    .favorito-imagen {
      text-align: center;
      margin-bottom: 1rem;
    }

    .favorito-imagen img {
      width: 100px;
      height: 100px;
      object-fit: cover;
      border-radius: 12px;
      border: 3px solid #ecf0f1;
    }

    .favorito-info {
      margin-bottom: 1rem;
    }

    .producto-nombre,
    .anuncio-producto {
      font-size: 1.25rem;
      font-weight: 600;
      color: #2c3e50;
      margin-bottom: 0.5rem;
    }

    .producto-descripcion,
    .anuncio-descripcion {
      color: #7f8c8d;
      font-size: 0.9rem;
      line-height: 1.4;
      margin-bottom: 1rem;
    }

    .producto-precio {
      display: flex;
      align-items: baseline;
      gap: 0.25rem;
    }

    .precio-valor {
      font-size: 1.5rem;
      font-weight: 700;
      color: #27ae60;
    }

    .precio-unidad {
      font-size: 0.9rem;
      color: #7f8c8d;
    }

    .anuncio-detalles {
      margin-top: 1rem;
    }

    .detalle-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
      padding: 0.25rem 0;
    }

    .detalle-item .label {
      font-weight: 500;
      color: #34495e;
      font-size: 0.9rem;
    }

    .detalle-item .value {
      font-weight: 600;
      color: #2c3e50;
      font-size: 0.9rem;
    }

    .precio-anuncio {
      color: #3498db !important;
    }

    .favorito-acciones {
      display: flex;
      gap: 0.5rem;
      flex-wrap: wrap;
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 6px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      flex: 1;
      justify-content: center;
      min-width: 120px;
    }

    .btn-primary {
      background: #3498db;
      color: white;
    }

    .btn-primary:hover {
      background: #2980b9;
      transform: translateY(-1px);
    }

    .btn-success {
      background: #25d366;
      color: white;
    }

    .btn-success:hover {
      background: #22c55e;
    }

    .btn-outline-primary {
      background: transparent;
      color: #3498db;
      border: 2px solid #3498db;
    }

    .btn-outline-primary:hover {
      background: #3498db;
      color: white;
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      color: #7f8c8d;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      color: #e74c3c;
      opacity: 0.6;
    }

    .empty-state h3 {
      margin-bottom: 1rem;
      color: #34495e;
    }

    .empty-actions {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-top: 2rem;
    }

    .loading-container {
      text-align: center;
      padding: 4rem;
    }

    .spinner {
      width: 50px;
      height: 50px;
      border: 4px solid #ecf0f1;
      border-top: 4px solid #e74c3c;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 1rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin: 2rem 0;
      text-align: center;
    }

    .alert-danger {
      background: #fadbd8;
      border: 2px solid #e74c3c;
      color: #c0392b;
    }

    .toast {
      position: fixed;
      top: 100px;
      right: 20px;
      background: white;
      color: #2c3e50;
      padding: 1rem 1.5rem;
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      z-index: 1050;
      transform: translateX(400px);
      transition: transform 0.3s ease;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-weight: 500;
      border-left: 4px solid;
    }

    .toast.show {
      transform: translateX(0);
    }

    .toast.success {
      border-left-color: #27ae60;
      background: #d5f4e6;
    }

    .toast.error {
      border-left-color: #e74c3c;
      background: #fadbd8;
    }

    .toast i {
      font-size: 1.2rem;
    }

    .toast.success i {
      color: #27ae60;
    }

    .toast.error i {
      color: #e74c3c;
    }

    @media (max-width: 768px) {
      .favoritos-container {
        padding: 1rem;
      }

      .favoritos-grid {
        grid-template-columns: 1fr;
      }

      .favorito-acciones {
        flex-direction: column;
      }

      .btn {
        flex: none;
        width: 100%;
        min-width: unset;
      }

      .empty-actions {
        flex-direction: column;
        align-items: center;
      }

      .toast {
        top: 80px;
        right: 10px;
        left: 10px;
        transform: translateY(-100px);
      }

      .toast.show {
        transform: translateY(0);
      }
    }
  `]
})
export class FavoritosComponent implements OnInit {
  favoritos: Favorito[] = [];
  productosFavoritos: Favorito[] = [];
  anunciosVentaFavoritos: Favorito[] = [];

  cargando = false;
  errorMensaje = '';

  // Toast notifications
  mostrarToastFlag = false;
  mensajeToast = '';
  tipoToast: 'success' | 'error' = 'success';

  constructor(private favoritosService: FavoritosService) {}

  ngOnInit(): void {
    this.cargarFavoritos();
  }

  cargarFavoritos(): void {
    this.cargando = true;
    this.errorMensaje = '';

    this.favoritosService.getFavoritos()
      .pipe(
        finalize(() => this.cargando = false)
      )
      .subscribe({
        next: (response: FavoritosListResponse) => {
          this.favoritos = response.favoritos || [];
          this.separarFavoritosPorTipo();
        },
        error: (error) => {
          this.errorMensaje = error.error?.mensaje ||
                             error.message ||
                             'Error al cargar los favoritos.';
          this.favoritos = [];
          this.productosFavoritos = [];
          this.anunciosVentaFavoritos = [];
        }
      });
  }

  private separarFavoritosPorTipo(): void {
    this.productosFavoritos = this.favoritos.filter(f => f.producto);
    this.anunciosVentaFavoritos = this.favoritos.filter(f => f.anuncio_venta);
  }

  onFavoritoToggled(event: { esFavorito: boolean; mensaje: string }): void {
    this.mostrarToast(event.mensaje, 'success');

    // Recargar favoritos para actualizar la lista
    setTimeout(() => {
      this.cargarFavoritos();
    }, 500);
  }

  onFavoritoError(mensaje: string): void {
    this.mostrarToast(mensaje, 'error');
  }

  contactarVendedorWhatsApp(anuncio: any): void {
    if (!anuncio.vendedor?.telefono) return;

    const mensaje = `¡Hola! Vi tu anuncio de *${anuncio.producto.nombre}* y me interesa.\n\n` +
                   `Cantidad: ${anuncio.cantidad} ${anuncio.unidad}\n` +
                   `Precio: $${anuncio.precio} / ${anuncio.producto.unidad_medida}\n` +
                   `Ubicación: ${anuncio.ubicacion || 'No especificada'}\n\n` +
                   `¿Podrías darme más detalles?`;

    const telefono = anuncio.vendedor.telefono.replace(/[^\d]/g, '');
    const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  }

  getFechaFormateada(fecha?: string): string {
    if (!fecha) return 'Sin fecha';

    try {
      const fechaObj = new Date(fecha);
      const ahora = new Date();
      const diff = ahora.getTime() - fechaObj.getTime();
      const dias = Math.floor(diff / (1000 * 60 * 60 * 24));

      if (dias === 0) {
        return 'Hoy';
      } else if (dias === 1) {
        return 'Ayer';
      } else if (dias < 7) {
        return `Hace ${dias} días`;
      } else {
        return fechaObj.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        });
      }
    } catch {
      return 'Fecha inválida';
    }
  }

  onImageError(event: any): void {
    event.target.src = 'assets/images/producto-placeholder.png';
  }

  private mostrarToast(mensaje: string, tipo: 'success' | 'error'): void {
    this.mensajeToast = mensaje;
    this.tipoToast = tipo;
    this.mostrarToastFlag = true;

    // Ocultar toast después de 3 segundos
    setTimeout(() => {
      this.mostrarToastFlag = false;
    }, 3000);
  }
}
