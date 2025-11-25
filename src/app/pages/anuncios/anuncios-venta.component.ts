// ...existing code...
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged } from 'rxjs';
import { AnunciosService, AnunciosVentaListResponseBackend, AnunciosQuery } from '../../core/services/anuncios.service';
import { ChatService } from '../../core/services/chat.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService } from '../../core/services/auth.service';
// import { SafeImageDirective } from '../../shared/directives/safe-image.directive';
import { BotonFavoritoComponent } from '../../shared/components/boton-favorito.component';
import { ChatDrawerComponent } from '../../components/chat-drawer.component';
import { ChatComponent } from '../../pages/chat/chat.component';

import { NotificationService } from '../../core/services/notification.service';
@Component({
  selector: 'app-anuncios-venta',
  standalone: true,
  imports: [CommonModule, FormsModule, BotonFavoritoComponent, RouterLink, ChatDrawerComponent, ChatComponent],
  template: `
    <div class="anuncios-container">
      <!-- Navigation Tabs -->
      <div class="marketplace-nav">
        <div class="nav-container">
          <div class="nav-tabs">
            <div class="tab active">
              <span class="tab-indicator"></span>
              <span class="tab-label">Anuncios de Venta</span>
            </div>
            <a routerLink="/anuncios/compra" class="tab">
              <span class="tab-label">Solicitudes de Compra</span>
            </a>
          </div>

          <div class="nav-actions">
            <a routerLink="/favoritos" class="action-btn secondary">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
              </svg>
              Favoritos
            </a>
            <button class="action-btn primary" (click)="crearAnuncio()">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
              </svg>
              Crear Anuncio
            </button>
          </div>
        </div>
      </div>

      <div class="page-header">
        <h1>Marketplace</h1>
        <p class="subtitle">Encuentra productos frescos directamente de los productores</p>
      </div>

      <!-- Filtros -->
      <div class="filtros-section">
        <div class="filtros-grid">
          <!-- Búsqueda -->
          <div class="filter-group">
            <label>Buscar</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="onSearchInput($event)"
              placeholder="Buscar productos..."
              class="filter-input">
          </div>

          <!-- Estado -->
          <div class="filter-group">
            <label>Estado</label>
            <select [(ngModel)]="filtros.estado" (change)="onFilterChange()" class="filter-select">
              <option value="">Todos</option>
              <option value="activo">Activo</option>
              <option value="pausado">Pausado</option>
              <option value="vendido">Vendido</option>
            </select>
          </div>

          <!-- Ubicación -->
          <div class="filter-group">
            <label>Ubicación</label>
            <input
              type="text"
              [(ngModel)]="filtros.ubicacion"
              (input)="onFilterChange()"
              placeholder="Ciudad o región..."
              class="filter-input">
          </div>

          <!-- Precio -->
          <div class="filter-group">
            <label>Precio máximo</label>
            <input
              type="number"
              [(ngModel)]="filtros.precio_max"
              (input)="onFilterChange()"
              placeholder="Ej: 500"
              min="0"
              step="0.01"
              class="filter-input">
          </div>
        </div>

        <button class="btn-limpiar" (click)="limpiarFiltros()">
          🗑️ Limpiar filtros
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="loading-container">
        <div class="loading-spinner"></div>
        <p>Cargando anuncios...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error && !loading" class="error-container">
        <div class="error-icon">⚠️</div>
        <p>{{ error }}</p>
        <button class="btn-retry" (click)="cargarAnuncios()">Reintentar</button>
      </div>

      <!-- Anuncios Grid -->
      <div *ngIf="!loading && !error" class="anuncios-grid">
        <div *ngFor="let anuncio of anuncios" class="anuncio-card" (click)="verDetallesAnuncio(anuncio.id_anuncio)">

          <!-- Imagen del producto -->
          <div class="anuncio-imagen">
            <img
              [src]="anuncio.Producto?.imagen_url || 'assets/no-image.png'"
              [alt]="anuncio.Producto?.nombre || 'Producto no disponible'"
              class="producto-img">

            <!-- Estado badge -->
            <div *ngIf="anuncio.estado" class="estado-badge" [ngClass]="'estado-' + anuncio.estado">
              {{ getEstadoLabel(anuncio.estado) }}
            </div>

            <!-- Fecha badge -->
            <div class="fecha-badge">
              {{ getFechaFormateada(anuncio.fecha_creacion) }}
            </div>

          </div>

          <!-- Información del anuncio -->
          <div class="anuncio-info">
            <h3 class="producto-nombre">{{ anuncio.Producto ? anuncio.Producto.nombre : 'Producto no disponible' }}</h3>
            <p class="anuncio-descripcion">{{ anuncio.descripcion }}</p>

            <div class="anuncio-details">
              <div class="detail-item">
                <span class="detail-label">Cantidad:</span>
                <span class="detail-value">{{ anuncio.cantidad }} {{ anuncio.unidad }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Precio por {{ anuncio.unidad }}:</span>
                <span class="detail-value precio">S/ {{ anuncio.precio | number:'1.2-2' }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Total disponible:</span>
                <span class="detail-value total">S/ {{ (anuncio.cantidad * anuncio.precio) | number:'1.2-2' }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Ubicación:</span>
                <span class="detail-value location">📍 {{ anuncio.ubicacion }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Vendedor:</span>
                <span class="detail-value vendedor">👤 {{ anuncio.vendedor?.nombre || 'Sin usuario' }}</span>
              </div>

              <div class="detail-item">
                <span class="detail-label">Teléfono:</span>
                <span class="detail-value telefono">📞 {{ anuncio.vendedor ? anuncio.vendedor.telefono : 'No disponible' }}</span>
              </div>
            </div>

            <div class="anuncio-actions">
              <button
                class="btn-pedir btn-primary"
                *ngIf="anuncio.estado === 'activo'"
                [disabled]="isOwnAnuncio(anuncio) || creandoPedido"
                (click)="onPedir(anuncio); $event.stopPropagation()">
                <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3" />
                </svg>
                Pedir
              </button>
            </div>
            <div *ngIf="modalPagoAbierto && pedidoPendiente && pedidoPendiente.id_anuncio === anuncio.id_anuncio" class="modal-pago">
              <div class="modal-overlay">
                <div class="modal-content-pago">
                  <div class="modal-header">
                    <h3>Simulación de Pago</h3>
                    <button class="close-btn" (click)="cerrarModalPago()" [disabled]="pagando">&times;</button>
                  </div>
                  <div class="modal-body">
                    <p class="text-lg mb-4">Monto total a pagar:</p>
                    <div class="monto-total">S/ {{ pedidoPendiente.monto_total | number:'1.2-2' }}</div>
                  </div>
                  <div class="modal-footer">
                    <button class="btn-pagar-modal" (click)="onPagarPedido()" [disabled]="pagando">
                      <span *ngIf="!pagando">Pagar</span>
                      <span *ngIf="pagando">Procesando...</span>
                    </button>
                    <button class="btn-cerrar-modal" (click)="cerrarModalPago()" [disabled]="pagando">Cancelar</button>
                  </div>
                </div>
              </div>
            </div>
              <app-chat-drawer *ngIf="drawerAbierto" (closed)="cerrarChatDrawer()">
                <app-chat [destinatarioId]="destinatarioIdDrawer" (cerrarChatDrawer)="cerrarChatDrawer()"></app-chat>
              </app-chat-drawer>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!loading && !error && anuncios.length === 0" class="empty-state">
        <div class="empty-icon">📢</div>
        <h3>No hay anuncios disponibles</h3>
        <p>No se encontraron anuncios que coincidan con tus filtros</p>
        <button class="btn-crear" (click)="limpiarFiltros()">
          Ver todos los anuncios
        </button>
      </div>

      <!-- Paginación -->
      <div *ngIf="paginacion && paginacion.pages > 1" class="pagination">
        <button
          class="btn-page"
          [disabled]="paginacion.page <= 1"
          (click)="goToPage(paginacion.page - 1)">
          ← Anterior
        </button>

        <div class="page-numbers">
          <button
            *ngFor="let page of getPageNumbers()"
            class="btn-page"
            [ngClass]="{'active': page === paginacion.page}"
            (click)="goToPage(page)">
            {{ page }}
          </button>
        </div>

        <button
          class="btn-page"
          [disabled]="paginacion.page >= paginacion.pages"
          (click)="goToPage(paginacion.page + 1)">
          Siguiente →
        </button>
      </div>
    </div>
  `,
  styleUrl: './anuncios-venta.component.scss'
})
export class AnunciosVentaComponent implements OnInit, OnDestroy {
      drawerAbierto = false;
      destinatarioIdDrawer: number|null = null;
      creandoPedido = false;
      modalPagoAbierto = false;
      pedidoPendiente: any = null;
      pagando = false;

  constructor(
    private anunciosService: AnunciosService,
    private chatService: ChatService,
    private pedidosService: PedidosService,
    private authService: AuthService,
    private notificationService: NotificationService,
    public router: Router
  ) {}

      abrirChatDrawer(anuncio: any) {
        this.destinatarioIdDrawer = anuncio.vendedor?.id_usuario || anuncio.vendedor?.id;
        this.drawerAbierto = true;
      }

      cerrarChatDrawer() {
        this.drawerAbierto = false;
        this.destinatarioIdDrawer = null;
      }
    contactarVendedorChat(anuncio: any): void {
      const idUsuarioDestinatario = anuncio.vendedor?.id_usuario || anuncio.vendedor?.id;
      if (!idUsuarioDestinatario) return;
      this.chatService.buscarChatConUsuario(idUsuarioDestinatario).subscribe((chatExistente: any) => {
        if (chatExistente) {
          this.router.navigate(['/chat', chatExistente.id_chat]);
        } else {
          this.chatService.crearChat({ id_usuario_destinatario: idUsuarioDestinatario }).subscribe((resp: any) => {
            if (resp.success && resp.data) {
              this.router.navigate(['/chat', resp.data.id_chat]);
            }
          });
        }
      });
    }
  anuncios: any[] = [];
  loading = true;
  error: string | null = null;
  paginacion: any = null;

  searchTerm = '';
  filtros: Partial<AnunciosQuery> = {
    page: 1,
    limit: 12
  };

  private searchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private subscriptions: Subscription[] = [];



  ngOnInit(): void {
    this.setupSearch();
    this.cargarAnuncios();
  }

  ngOnDestroy(): void {
    this.searchSubscription?.unsubscribe();
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private setupSearch(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(searchTerm => {
      this.filtros.search = searchTerm || undefined;
      this.filtros.page = 1;
      this.cargarAnuncios();
    });
  }

  onSearchInput(event: any): void {
    const value = event.target.value;
    this.searchSubject.next(value);
  }

  onFilterChange(): void {
    this.filtros.page = 1;
    this.cargarAnuncios();
  }

  limpiarFiltros(): void {
    this.searchTerm = '';
    this.filtros = {
      page: 1,
      limit: 12
    };
    this.cargarAnuncios();
  }

  cargarAnuncios(): void {
    this.loading = true;
    this.error = null;

    const query: AnunciosQuery = { ...this.filtros };

    const sub = this.anunciosService.getAnunciosVenta(query).subscribe({
      next: (response: AnunciosVentaListResponseBackend) => {
        this.anuncios = response.anuncios
          .filter(anuncio => anuncio.estado === 'activo')
          .map(anuncio => ({
            id: anuncio.id_anuncio,
            Producto: anuncio.Producto, // Asegura que la propiedad se llame igual que en el template
            vendedor: anuncio.Usuario,
            cantidad: anuncio.cantidad,
            unidad: anuncio.unidad,
            precio: anuncio.precio,
            descripcion: anuncio.descripcion,
            ubicacion: anuncio.ubicacion,
            ubicacion_lat: anuncio.ubicacion_lat,
            ubicacion_lng: anuncio.ubicacion_lng,
            fecha_creacion: anuncio.fecha_publicacion,
            estado: anuncio.estado
          }));
        this.paginacion = response.paginacion ? {
          total: response.paginacion.total,
          page: response.paginacion.page || 1,
          limit: response.paginacion.limit || 20,
          pages: response.paginacion.pages || Math.ceil((response.paginacion.total || 0) / (response.paginacion.limit || 20))
        } : {
          total: response.total || 0,
          page: response.page || 1,
          limit: response.limit || 20,
          pages: response.pages || Math.ceil((response.total || 0) / (response.limit || 20))
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading announcements:', error);
        this.error = 'Error al cargar los anuncios. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });

    this.subscriptions.push(sub);
  }

  goToPage(page: number): void {
    if (this.paginacion && page >= 1 && page <= this.paginacion.pages) {
      this.filtros.page = page;
      this.cargarAnuncios();
      window.scrollTo(0, 0);
    }
  }

  getPageNumbers(): number[] {
    if (!this.paginacion) return [];

    const currentPage = this.paginacion.page;
    const totalPages = this.paginacion.pages;
    const delta = 2;

    let start = Math.max(currentPage - delta, 1);
    let end = Math.min(currentPage + delta, totalPages);

    if (end - start < 4) {
      if (start === 1) {
        end = Math.min(start + 4, totalPages);
      } else if (end === totalPages) {
        start = Math.max(end - 4, 1);
      }
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  getEstadoLabel(estado: string): string {
    const labels: { [key: string]: string } = {
      activo: 'Activo',
      pausado: 'Pausado',
      vendido: 'Vendido',
      expirado: 'Expirado'
    };
    return labels[estado] || estado;
  }

  crearAnuncio(): void {
    this.router.navigate(['/anuncios/crear']);
  }

  verDetallesAnuncio(id: number): void {
    this.router.navigate(['/anuncios', id]);
  }


  contactarVendedor(anuncio: any): void {
    // Lógica: buscar o crear chat y redirigir
    const idUsuarioDestinatario = anuncio.vendedor.id_usuario || anuncio.vendedor.id;
    this.chatService.buscarChatConUsuario(idUsuarioDestinatario).subscribe(chatExistente => {
      if (chatExistente) {
        // Redirigir al chat existente
        this.router.navigate(['/chat', chatExistente.id_chat]);
      } else {
        // Crear chat y redirigir
        this.chatService.crearChat({ id_usuario_destinatario: idUsuarioDestinatario }).subscribe(resp => {
          if (resp.success && resp.data) {
            this.router.navigate(['/chat', resp.data.id_chat]);
          }
        });
      }
    });
  }

  contactarWhatsApp(anuncio: any): void {
    const mensaje = `Hola ${anuncio.vendedor.nombre}, me interesa tu anuncio de "${anuncio.producto.nombre}" - ${anuncio.cantidad} ${anuncio.unidad} por S/ ${anuncio.precio} cada ${anuncio.unidad}. ¿Podemos conversar?`;
    const telefono = anuncio.vendedor.telefono.replace(/\D/g, ''); // Quitar caracteres no numéricos
    const whatsappUrl = `https://wa.me/591${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  }

  getFechaFormateada(fechaString: string): string {
    try {
      const fecha = new Date(fechaString);
      return fecha.toLocaleDateString('es-BO', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return 'Fecha no válida';
    }
  }

  onFavoritoToggled(event: { esFavorito: boolean; mensaje: string }): void {
    // Mostrar mensaje de éxito
    console.log(event.mensaje);
    // Aquí podrías agregar un toast o notificación si tienes el servicio
  }

  onFavoritoError(error: string): void {
    // Mostrar mensaje de error
    console.error('Error con favoritos:', error);
    // Aquí podrías agregar un toast o notificación si tienes el servicio
  }

  isOwnAnuncio(anuncio: any): boolean {
    const user = this.authService.getCurrentUser();
    return user && anuncio.vendedor && user.id_usuario === anuncio.vendedor.id_usuario;
  }

  onPedir(anuncio: any): void {
    if (!this.authService.getToken()) {
      this.router.navigate(['/auth/login']);
      return;
    }
    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/auth/login']);
      return;
    }
    this.creandoPedido = true;
    const pedido = {
      id_comprador: user.id_usuario,
      id_vendedor: anuncio.vendedor.id_usuario,
      id_anuncio: anuncio.id_anuncio || anuncio.id,
      tipo_anuncio: 'venta' as const,
      monto_total: anuncio.precio * anuncio.cantidad
    };
    this.pedidosService.crearPedido(pedido).subscribe({
      next: (resp) => {
        this.creandoPedido = false;
        console.log('Respuesta del backend al crear pedido:', resp);
        if (resp && resp.pedido && resp.pedido.id && resp.pedido.id_anuncio && resp.pedido.monto_total) {
          this.pedidoPendiente = { ...pedido, id: resp.pedido.id, id_anuncio: resp.pedido.id_anuncio, monto_total: resp.pedido.monto_total };
          this.modalPagoAbierto = true;
        } else {
          this.notificationService?.show?.({
            title: 'Error',
            message: 'La respuesta del servidor no es válida.',
            type: 'error'
          });
        }
      },
      error: (err) => {
        console.error('Error al crear el pedido:', err);
        this.notificationService?.show?.({
          title: 'Error',
          message: err?.error?.mensaje || 'No se pudo crear el pedido. Intente de nuevo.',
          type: 'error'
        });
        this.creandoPedido = false;
      }
    });
  }

  cerrarModalPago(): void {
    this.modalPagoAbierto = false;
    this.pedidoPendiente = null;
  }

  onPagarPedido(): void {
    if (!this.pedidoPendiente) return;
    this.pagando = true;
    this.pedidosService.simularPago(this.pedidoPendiente.id).subscribe({
      next: () => {
        this.pagando = false;
        this.modalPagoAbierto = false;
        this.pedidoPendiente = null;
        this.notificationService?.show?.({
          title: 'Pago realizado',
          message: 'El anuncio ya no estará disponible.',
          type: 'success'
        });
        this.cargarAnuncios();
      },
      error: (err) => {
        this.notificationService?.show?.({
          title: 'Error',
          message: err?.error?.mensaje || 'No se pudo simular el pago. Intente de nuevo.',
          type: 'error'
        });
        this.pagando = false;
      }
    });
  }
}
