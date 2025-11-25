import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AdminProductosService, ActualizarProductoData } from '../../core/services/admin-productos.service';
import { NotificationService } from '../../core/services/notification.service';

interface Categoria {
  id: number;
  nombre: string;
}

interface Vendedor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

@Component({
  selector: 'app-editar-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-gray-100 py-8">
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center space-x-4">
            <button
              (click)="volver()"
              class="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
            </button>
            <div>
              <h1 class="text-3xl font-bold text-gray-900">Editar Producto</h1>
              <p class="text-gray-600 mt-2">Actualiza la información del producto</p>
            </div>
          </div>
        </div>

        <!-- Formulario -->
        <div class="bg-white rounded-lg shadow-sm border border-gray-200">
          <form [formGroup]="productoForm" (ngSubmit)="onSubmit()" class="p-6 space-y-6">

            <!-- Imagen actual y cambio -->
            <div class="border-b border-gray-200 pb-6">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Imagen del Producto</h3>

              <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <!-- Imagen actual -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Imagen Actual</label>
                  <div class="aspect-square bg-gray-100 rounded-lg overflow-hidden border-2 border-dashed border-gray-300">
                    <img
                      *ngIf="imagenActual"
                      [src]="imagenActual"
                      alt="Imagen actual del producto"
                      class="w-full h-full object-cover">
                    <div
                      *ngIf="!imagenActual"
                      class="w-full h-full flex items-center justify-center text-gray-400">
                      <div class="text-center">
                        <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                        </svg>
                        <p class="text-sm">Sin imagen</p>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Cambiar imagen -->
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Cambiar Imagen</label>
                  <div class="space-y-4">
                    <input
                      type="file"
                      #fileInput
                      (change)="onFileSelected($event)"
                      accept="image/*"
                      class="hidden">

                    <!-- Botón para seleccionar archivo -->
                    <button
                      type="button"
                      (click)="fileInput.click()"
                      class="w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 transition-colors flex items-center justify-center space-x-2 text-gray-600 hover:text-green-600">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      <span>Seleccionar nueva imagen</span>
                    </button>

                    <!-- Preview de nueva imagen -->
                    <div *ngIf="nuevaImagenPreview" class="relative">
                      <img
                        [src]="nuevaImagenPreview"
                        alt="Preview de nueva imagen"
                        class="w-full h-32 object-cover rounded-lg border border-gray-200">
                      <button
                        type="button"
                        (click)="eliminarNuevaImagen()"
                        class="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>

                    <!-- Botón para subir imagen -->
                    <button
                      *ngIf="nuevaImagenArchivo && !subiendoImagen"
                      type="button"
                      (click)="subirNuevaImagen()"
                      class="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4"/>
                      </svg>
                      <span>Subir Nueva Imagen</span>
                    </button>

                    <!-- Estado de carga de imagen -->
                    <div *ngIf="subiendoImagen" class="flex items-center justify-center space-x-2 text-blue-600">
                      <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <span class="text-sm">Subiendo imagen...</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Información del producto (solo lectura) -->
            <div *ngIf="!cargando" class="bg-gray-50 rounded-lg p-4 border-b border-gray-200">
              <h3 class="text-lg font-medium text-gray-900 mb-4">Información del Producto</h3>
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                <div>
                  <span class="font-medium text-gray-700">ID del Producto:</span>
                  <span class="ml-2 text-gray-900">{{ productoId }}</span>
                </div>
                <div *ngIf="categoriaActual">
                  <span class="font-medium text-gray-700">Categoría Actual:</span>
                  <span class="ml-2 text-gray-900 bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">{{ categoriaActual }}</span>
                </div>
                <div *ngIf="fechaRegistro">
                  <span class="font-medium text-gray-700">Fecha de Registro:</span>
                  <span class="ml-2 text-gray-900">{{ fechaRegistro }}</span>
                </div>
              </div>
            </div>

            <!-- Información básica -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Nombre -->
              <div>
                <label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  id="nombre"
                  formControlName="nombre"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: Papa Blanca Premium"
                  [class.border-red-300]="isFieldInvalid('nombre')">
                <div *ngIf="isFieldInvalid('nombre')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('nombre')?.errors?.['required']">El nombre es requerido</span>
                  <span *ngIf="productoForm.get('nombre')?.errors?.['minlength']">Mínimo 3 caracteres</span>
                  <span *ngIf="productoForm.get('nombre')?.errors?.['maxlength']">Máximo 100 caracteres</span>
                </div>
              </div>

              <!-- Precio -->
              <div>
                <label for="precio" class="block text-sm font-medium text-gray-700 mb-2">
                  Precio *
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-2 text-gray-500">$</span>
                  <input
                    type="number"
                    id="precio"
                    formControlName="precio"
                    step="0.01"
                    min="0"
                    class="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="0.00"
                    [class.border-red-300]="isFieldInvalid('precio')">
                </div>
                <div *ngIf="isFieldInvalid('precio')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('precio')?.errors?.['required']">El precio es requerido</span>
                  <span *ngIf="productoForm.get('precio')?.errors?.['min']">El precio debe ser mayor a 0</span>
                </div>
              </div>
            </div>

            <!-- Descripción -->
            <div>
              <label for="descripcion" class="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                id="descripcion"
                formControlName="descripcion"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Describe el producto..."
                [class.border-red-300]="isFieldInvalid('descripcion')"></textarea>
              <div *ngIf="isFieldInvalid('descripcion')" class="mt-1 text-sm text-red-600">
                <span *ngIf="productoForm.get('descripcion')?.errors?.['maxlength']">Máximo 500 caracteres</span>
              </div>
            </div>

            <!-- Detalles -->
            <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <!-- Unidad -->
              <div>
                <label for="unidad" class="block text-sm font-medium text-gray-700 mb-2">
                  Unidad de Medida *
                </label>
                <select
                  id="unidad"
                  formControlName="unidad"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  [class.border-red-300]="isFieldInvalid('unidad')">
                  <option value="">Seleccionar</option>
                  <option value="kg">Kilogramo (kg)</option>
                  <option value="lb">Libra (lb)</option>
                  <option value="unidad">Unidad</option>
                  <option value="litro">Litro</option>
                  <option value="gramo">Gramo</option>
                </select>
                <div *ngIf="isFieldInvalid('unidad')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('unidad')?.errors?.['required']">Seleccione una unidad</span>
                </div>
              </div>

              <!-- Cantidad -->
              <div>
                <label for="cantidad_disponible" class="block text-sm font-medium text-gray-700 mb-2">
                  Cantidad Disponible *
                </label>
                <input
                  type="number"
                  id="cantidad_disponible"
                  formControlName="cantidad_disponible"
                  min="0"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  [class.border-red-300]="isFieldInvalid('cantidad_disponible')">
                <div *ngIf="isFieldInvalid('cantidad_disponible')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('cantidad_disponible')?.errors?.['required']">La cantidad es requerida</span>
                  <span *ngIf="productoForm.get('cantidad_disponible')?.errors?.['min']">La cantidad debe ser mayor o igual a 0</span>
                </div>
              </div>

              <!-- Estado -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <div class="flex items-center space-x-4 pt-2">
                  <label class="flex items-center">
                    <input
                      type="checkbox"
                      formControlName="disponible"
                      class="rounded border-gray-300 text-green-600 shadow-sm focus:border-green-300 focus:ring focus:ring-green-200 focus:ring-opacity-50">
                    <span class="ml-2 text-sm text-gray-600">Disponible</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Relaciones -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <!-- Categoría -->
              <div>
                <label for="categoria_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Categoría *
                </label>
                <select
                  id="categoria_id"
                  formControlName="categoria_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  [class.border-red-300]="isFieldInvalid('categoria_id')">
                  <option value="">Seleccionar categoría</option>
                  <option *ngFor="let categoria of categorias" [value]="categoria.id">
                    {{ categoria.nombre }}
                  </option>
                </select>
                <div *ngIf="isFieldInvalid('categoria_id')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('categoria_id')?.errors?.['required']">Seleccione una categoría</span>
                </div>
              </div>

              <!-- Vendedor -->
              <div>
                <label for="vendedor_id" class="block text-sm font-medium text-gray-700 mb-2">
                  Vendedor *
                </label>
                <select
                  id="vendedor_id"
                  formControlName="vendedor_id"
                  class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  [class.border-red-300]="isFieldInvalid('vendedor_id')">
                  <option value="">Seleccionar vendedor</option>
                  <option *ngFor="let vendedor of vendedores" [value]="vendedor.id">
                    {{ vendedor.nombre }} {{ vendedor.apellido }} ({{ vendedor.email }})
                  </option>
                </select>
                <div *ngIf="isFieldInvalid('vendedor_id')" class="mt-1 text-sm text-red-600">
                  <span *ngIf="productoForm.get('vendedor_id')?.errors?.['required']">Seleccione un vendedor</span>
                </div>
              </div>
            </div>

            <!-- Estado de carga -->
            <div *ngIf="cargando" class="text-center py-4">
              <div class="inline-flex items-center space-x-2 text-gray-600">
                <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                <span>Cargando producto...</span>
              </div>
            </div>

            <!-- Botones -->
            <div class="flex justify-end space-x-4 pt-6 border-t border-gray-200">
              <button
                type="button"
                (click)="volver()"
                class="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">
                Cancelar
              </button>
              <button
                type="submit"
                [disabled]="productoForm.invalid || enviando"
                class="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
                <div *ngIf="enviando" class="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>{{ enviando ? 'Actualizando...' : 'Actualizar Producto' }}</span>
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  `,
  styleUrls: ['./editar-producto.component.scss']
})
export class EditarProductoComponent implements OnInit {
  productoForm: FormGroup;
  categorias: Categoria[] = [];
  vendedores: Vendedor[] = [];
  cargando = false;
  enviando = false;
  productoId: number | null = null;

  // Variables para manejo de imagen
  imagenActual: string | null = null;
  nuevaImagenArchivo: File | null = null;
  nuevaImagenPreview: string | null = null;
  subiendoImagen = false;

  // Variables para información adicional
  categoriaActual: string | null = null;
  fechaRegistro: string | null = null;

  constructor(
    private fb: FormBuilder,
    private adminProductosService: AdminProductosService,
    private notificationService: NotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productoForm = this.createForm();
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productoId = +params['id'];
      if (this.productoId) {
        this.cargarProducto();
      }
    });
    this.cargarCategorias();
    this.cargarVendedores();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.maxLength(500)]],
      precio: [0, [Validators.required, Validators.min(0.01)]],
      unidad: ['', [Validators.required]],
      disponible: [true],
      cantidad_disponible: [0, [Validators.required, Validators.min(0)]],
      vendedor_id: ['', [Validators.required]],
      categoria_id: ['', [Validators.required]]
    });
  }

  cargarProducto(): void {
    if (!this.productoId) return;

    this.cargando = true;
    this.adminProductosService.obtenerProducto(this.productoId).subscribe({
      next: (response: any) => {
        const productoBackend = response.producto;
        console.log('[Debug] Producto del backend:', productoBackend);

        // Guardar imagen actual (robusto)
        this.imagenActual = productoBackend.imagen_url
          ? productoBackend.imagen_url
          : (productoBackend.imagen ? productoBackend.imagen : null);
        // Si no hay imagen, usar un placeholder
        if (!this.imagenActual) {
          this.imagenActual = 'assets/no-image.png';
        }

        // Guardar información adicional
        const categoria = productoBackend.Categoria?.[0] || productoBackend.categorias?.[0];
        this.categoriaActual = categoria?.nombre || 'Sin categoría';
        this.fechaRegistro = productoBackend.fecha_registro
          ? new Date(productoBackend.fecha_registro).toLocaleDateString('es-ES')
          : null;

        // Mostrar información de categorías en consola para debugging
        if (productoBackend.Categoria || productoBackend.categorias) {
          console.log('[Debug] Categorías del producto:', productoBackend.Categoria || productoBackend.categorias);
        }

        // Mapear datos del backend al formulario
        this.productoForm.patchValue({
          nombre: productoBackend.nombre,
          descripcion: productoBackend.descripcion,
          precio: parseFloat(productoBackend.precio_referencial),
          unidad: productoBackend.unidad_medida,
          disponible: productoBackend.activo ?? productoBackend.estado ?? true,
          cantidad_disponible: productoBackend.cantidad_disponible ?? 0,
          vendedor_id: productoBackend.id_usuario ?? '',
          categoria_id: productoBackend.id_categoria ?? categoria?.id_categoria ?? ''
        });

        this.cargando = false;
      },
      error: (error) => {
        console.error('[Error] Al cargar producto:', error);
        this.notificationService.show({
          title: 'Error',
          message: 'No se pudo cargar el producto',
          type: 'error'
        });
        this.cargando = false;
        this.volver();
      }
    });
  }  cargarCategorias(): void {
    // Categorías actualizadas basadas en el backend
    this.categorias = [
      { id: 1, nombre: 'Verduras' },
      { id: 2, nombre: 'Frutas' },
      { id: 3, nombre: 'Tubérculos' },
      { id: 4, nombre: 'Lácteos' },
      { id: 5, nombre: 'Carnes' },
      { id: 6, nombre: 'Granos y Cereales' },
      { id: 7, nombre: 'Especias y Condimentos' }
    ];
  }

  cargarVendedores(): void {
    // Implementar llamada para obtener vendedores
    // Por ahora usar datos de ejemplo
    this.vendedores = [
      { id: 1, nombre: 'Juan', apellido: 'Pérez', email: 'juan@email.com' },
      { id: 2, nombre: 'María', apellido: 'García', email: 'maria@email.com' },
      { id: 3, nombre: 'Carlos', apellido: 'López', email: 'carlos@email.com' }
    ];
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.productoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  // Métodos para manejo de imagen
  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.show({
          title: 'Archivo inválido',
          message: 'Por favor selecciona un archivo de imagen válido',
          type: 'error'
        });
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.show({
          title: 'Archivo muy grande',
          message: 'El archivo no debe superar los 5MB',
          type: 'error'
        });
        return;
      }

      this.nuevaImagenArchivo = file;

      // Crear preview
      const reader = new FileReader();
      reader.onload = (e) => {
        this.nuevaImagenPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarNuevaImagen(): void {
    this.nuevaImagenArchivo = null;
    this.nuevaImagenPreview = null;
  }

  subirNuevaImagen(): void {
    if (!this.nuevaImagenArchivo || !this.productoId) return;

    this.subiendoImagen = true;

    this.adminProductosService.subirImagenProducto(this.productoId, this.nuevaImagenArchivo).subscribe({
      next: (response) => {
        console.log('[Response] Imagen subida:', response);
        this.imagenActual = response.imagen_url;
        this.eliminarNuevaImagen();
        this.subiendoImagen = false;

        this.notificationService.show({
          title: 'Imagen actualizada',
          message: 'La imagen del producto se actualizó correctamente',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('[Error] Al subir imagen:', error);
        this.subiendoImagen = false;

        this.notificationService.show({
          title: 'Error al subir imagen',
          message: error.error?.mensaje || 'No se pudo actualizar la imagen',
          type: 'error'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.productoForm.invalid || !this.productoId) {
      this.markFormGroupTouched();
      return;
    }

    this.enviando = true;
    const formData: ActualizarProductoData = this.productoForm.value;

    this.adminProductosService.actualizarProducto(this.productoId, formData).subscribe({
      next: (response) => {
        console.log('[Response] Producto actualizado:', response);
        this.notificationService.show({
          title: 'Producto actualizado',
          message: response.mensaje || 'El producto se actualizó exitosamente',
          type: 'success'
        });
        this.enviando = false;
        this.volver();
      },
      error: (error) => {
        console.error('[Error] Al actualizar producto:', error);
        this.notificationService.show({
          title: 'Error',
          message: error.error?.mensaje || 'Error al actualizar el producto',
          type: 'error'
        });
        this.enviando = false;
      }
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productoForm.controls).forEach(key => {
      const control = this.productoForm.get(key);
      control?.markAsTouched();
    });
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
