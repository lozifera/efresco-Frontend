import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminProductosService } from '../../core/services/admin-productos.service';
import { NotificationService } from '../../core/services/notification.service';

interface Producto {
  id: number;
  nombre: string;
  descripcion: string;
  precio: number;
  unidad: string;
  disponible: boolean;
  imagen_url?: string;
  fecha_creacion: string;
  categorias: string;
}

@Component({
  selector: 'app-ver-producto',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-100 py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Header con navegación -->
        <div class="mb-8">
          <div class="flex items-center space-x-4 mb-4">
            <button
              (click)="volver()"
              class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Detalles del Producto</h1>
              <p class="text-gray-600 mt-1">Información completa del producto</p>
            </div>
          </div>

          <!-- Botones de acción -->
          <div class="flex space-x-4" *ngIf="producto && !cargando">
            <button
              (click)="editarProducto()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
              </svg>
              <span>Editar</span>
            </button>

            <button
              (click)="eliminarProducto()"
              class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              <span>Eliminar</span>
            </button>
          </div>
        </div>

        <!-- Estado de carga -->
        <div *ngIf="cargando" class="flex justify-center items-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p class="text-gray-600">Cargando producto...</p>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="error && !cargando" class="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <div class="text-red-600 mb-4">
            <svg class="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <h3 class="text-lg font-medium text-red-900 mb-2">Error al cargar producto</h3>
          <p class="text-red-700 mb-4">{{ error }}</p>
          <button
            (click)="cargarProducto()"
            class="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
            Intentar de nuevo
          </button>
        </div>

        <!-- Contenido del producto -->
        <div *ngIf="producto && !cargando" class="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div class="grid grid-cols-1 lg:grid-cols-2 gap-8 p-6">

            <!-- Imagen del producto -->
            <div class="space-y-4">
              <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                <img
                  *ngIf="producto.imagen_url"
                  [src]="producto.imagen_url"
                  [alt]="producto.nombre"
                  class="w-full h-full object-cover">
                <div
                  *ngIf="!producto.imagen_url"
                  class="w-full h-full flex items-center justify-center text-gray-400">
                  <svg class="w-24 h-24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Información del producto -->
            <div class="space-y-6">

              <!-- Nombre y estado -->
              <div>
                <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ producto.nombre }}</h2>
                <div class="flex items-center space-x-2">
                  <span [class]="producto.disponible
                    ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'
                    : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'">
                    {{ producto.disponible ? 'Disponible' : 'No disponible' }}
                  </span>
                </div>
              </div>

              <!-- Precio -->
              <div class="border-b border-gray-200 pb-4">
                <p class="text-sm font-medium text-gray-700 mb-1">Precio</p>
                <p class="text-3xl font-bold text-green-600">\${{ producto.precio | number:'1.2-2' }}</p>
                <p class="text-sm text-gray-600">por {{ producto.unidad }}</p>
              </div>

              <!-- Descripción -->
              <div class="border-b border-gray-200 pb-4">
                <p class="text-sm font-medium text-gray-700 mb-2">Descripción</p>
                <p class="text-gray-900">{{ producto.descripcion || 'Sin descripción disponible' }}</p>
              </div>

              <!-- Información adicional -->
              <div class="border-b border-gray-200 pb-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Categorías</h4>
                <p class="text-lg text-gray-900">{{ producto.categorias || 'Sin categoría' }}</p>
              </div>

              <!-- IDs de referencia -->
              <div class="bg-gray-50 rounded-lg p-4">
                <h4 class="text-sm font-medium text-gray-700 mb-3">Información de sistema</h4>
                <div class="grid grid-cols-1 gap-3 text-sm">
                  <div class="flex justify-between">
                    <span class="text-gray-600">ID del producto:</span>
                    <span class="font-medium">{{ producto.id }}</span>
                  </div>
                  <div *ngIf="producto.fecha_creacion" class="flex justify-between">
                    <span class="text-gray-600">Fecha de registro:</span>
                    <span class="font-medium">{{ formatearFecha(producto.fecha_creacion) }}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./ver-producto.component.scss']
})
export class VerProductoComponent implements OnInit {
  producto: Producto | null = null;
  cargando = false;
  error: string | null = null;
  productoId: number | null = null;

  constructor(
    private adminProductosService: AdminProductosService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productoId = +params['id'];
      if (this.productoId) {
        this.cargarProducto();
      } else {
        this.error = 'ID de producto no válido';
      }
    });
  }

  cargarProducto(): void {
    if (!this.productoId) return;

    this.cargando = true;
    this.error = null;

    this.adminProductosService.obtenerProducto(this.productoId).subscribe({
      next: (response: any) => {
        console.log('[Response] Producto cargado:', response);
        const productoBackend = response.producto;

        // Mapear datos del backend al formato del frontend
        this.producto = {
          id: productoBackend.id_producto,
          nombre: productoBackend.nombre,
          descripcion: productoBackend.descripcion,
          precio: parseFloat(productoBackend.precio_referencial),
          unidad: productoBackend.unidad_medida,
          disponible: productoBackend.estado,
          imagen_url: productoBackend.imagen_url,
          fecha_creacion: productoBackend.fecha_registro,
          categorias: (productoBackend.Categoria || productoBackend.categorias || [])
            .map((cat: any) => cat.nombre)
            .join(', ') || 'Sin categoría'
        };

        this.cargando = false;
      },
      error: (error) => {
        console.error('[Error] Al cargar producto:', error);
        this.error = error.error?.mensaje || 'No se pudo cargar el producto';
        this.cargando = false;
      }
    });
  }  editarProducto(): void {
    if (this.productoId) {
      this.router.navigate(['/admin']);
    }
  }

  eliminarProducto(): void {
    if (!this.producto || !this.productoId) return;

    if (confirm(`¿Está seguro de que desea eliminar "${this.producto.nombre}"?`)) {
      this.adminProductosService.eliminarProducto(this.productoId).subscribe({
        next: (response) => {
          console.log('[Response] Producto eliminado:', response);
          this.notificationService.show({
            title: 'Producto eliminado',
            message: response.mensaje || 'El producto fue eliminado exitosamente',
            type: 'success'
          });
          this.volver();
        },
        error: (error) => {
          console.error('[Error] Al eliminar producto:', error);
          this.notificationService.show({
            title: 'Error',
            message: error.error?.mensaje || 'Error al eliminar el producto',
            type: 'error'
          });
        }
      });
    }
  }

  formatearFecha(fecha: string): string {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return fecha;
    }
  }

  volver(): void {
    // Obtener parámetros de retorno si existen
    this.route.queryParams.subscribe(params => {
      const returnUrl = params['returnUrl'] || '/admin';
      const page = params['page'];

      if (page && returnUrl === '/admin') {
        this.router.navigate([returnUrl], {
          queryParams: { page: page },
          replaceUrl: true
        });
      } else {
        this.router.navigate([returnUrl], { replaceUrl: true });
      }
    }).unsubscribe();
  }
}
