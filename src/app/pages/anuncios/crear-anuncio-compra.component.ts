import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { debounceTime, distinctUntilChanged } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AnunciosService, AnuncioCompraRequest, AnuncioCompraResponse } from '../../core/services/anuncios.service';
import { ProductosService, Producto } from '../../core/services/productos.service';

@Component({
  selector: 'app-crear-anuncio-compra',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="crear-anuncio-compra-container">
      <div class="header">
        <h2><i class="fas fa-shopping-cart"></i> Crear Anuncio de Compra</h2>
        <p class="subtitle">Publica lo que necesitas comprar y conecta con productores</p>
      </div>

      <form [formGroup]="anuncioForm" (ngSubmit)="onSubmit()" class="anuncio-form">
    <div *ngIf="!productoValido" class="alert alert-warning" style="margin-bottom: 1rem;">
      <i class="fas fa-exclamation-triangle"></i> Debes seleccionar un producto de la lista.
    </div>

        <!-- Búsqueda y selección de producto -->
        <div class="form-group">
          <label for="producto-search" class="required">Producto que necesitas</label>
          <div class="producto-search-container">
            <input
              type="text"
              id="producto-search"
              class="form-control"
              placeholder="Buscar producto..."
              [value]="productoSeleccionado ? productoSeleccionado.nombre : ''"
              [readonly]="!!productoSeleccionado"
              (input)="!productoSeleccionado && onProductoSearch($event)"
              (focus)="mostrarResultados = true"
            >
            <!-- Campo oculto para id_producto -->
            <input type="hidden" formControlName="id_producto">
            <div class="search-results" *ngIf="productosEncontrados.length > 0 && mostrarResultados">
              <div
                *ngFor="let producto of productosEncontrados"
                class="search-result-item"
                (click)="seleccionarProducto(producto)"
              >
                <div class="producto-info">
                  <img [src]="producto.imagen_url" [alt]="producto.nombre" class="producto-imagen" />
                  <div class="producto-details">
                    <h4>{{ producto.nombre }}</h4>
                    <p>{{ producto.descripcion }}</p>
                    <span class="precio-ref">Precio ref: $ {{ producto.precio_referencial }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Producto seleccionado -->
        <div class="producto-seleccionado" *ngIf="productoSeleccionado">
          <h4>Producto seleccionado:</h4>
          <div class="producto-card">
            <img [src]="productoSeleccionado.imagen_url" [alt]="productoSeleccionado.nombre" />
            <div class="producto-info">
              <h5>{{ productoSeleccionado.nombre }}</h5>
              <p>{{ productoSeleccionado.descripcion }}</p>
              <span class="unidad-medida">Unidad: {{ productoSeleccionado.unidad_medida }}</span>
            </div>
          </div>
          <button type="button" class="btn btn-link text-danger" (click)="quitarSeleccionProducto()">Quitar selección</button>
        </div>

        <!-- Cantidad y unidad -->
        <div class="form-row">
          <div class="form-group">
            <label for="cantidad" class="required">Cantidad necesaria</label>
            <input
              type="number"
              id="cantidad"
              formControlName="cantidad"
              class="form-control"
              placeholder="Ej: 100"
              min="1"
              step="0.01"
            >
          </div>

          <div class="form-group">
            <label for="unidad" class="required">Unidad de medida</label>
            <select
              id="unidad"
              formControlName="unidad"
              class="form-control"
            >
              <option value="">Seleccionar unidad</option>
              <option value="kg">Kilogramos (kg)</option>
              <option value="lb">Libras (lb)</option>
              <option value="unidad">Unidades</option>
              <option value="caja">Cajas</option>
              <option value="saco">Sacos</option>
            </select>
          </div>
        </div>

        <!-- Precio ofertado -->
        <div class="form-group">
          <label for="precio_ofertado" class="required">Precio ofertado</label>
          <div class="input-group">
            <span class="input-group-text">$</span>
            <input
              type="number"
              id="precio_ofertado"
              formControlName="precio_ofertado"
              class="form-control"
              placeholder="0.00"
              min="0.01"
              step="0.01"
            >
          </div>
        </div>

        <!-- Descripción -->
        <div class="form-group">
          <label for="descripcion">Descripción adicional</label>
          <textarea
            id="descripcion"
            formControlName="descripcion"
            class="form-control"
            rows="4"
            placeholder="Describe detalles específicos..."
            maxlength="500"
          ></textarea>
        </div>

        <!-- Botones -->
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" (click)="cancelar()">
            Cancelar
          </button>
          <button type="submit" class="btn btn-primary" [disabled]="anuncioForm.invalid || cargando || !productoValido">
            <span *ngIf="cargando" class="spinner-border spinner-border-sm me-2"></span>
            {{ cargando ? 'Publicando...' : 'Publicar Anuncio' }}
          </button>
        </div>
        <!-- Log visual de depuración -->
        <b style="font-size:12px;color:#888;margin-top:1rem;display:block;">Debug:</b>
        <span style="font-size:12px;color:#888;">id_producto={{ anuncioForm.get('id_producto')?.value }} | productoValido={{ productoValido }} | Form valid={{ anuncioForm.valid }}</span>
      </form>

      <!-- Estados -->
      <div class="alert alert-success" *ngIf="anuncioCreado">
        <h5><i class="fas fa-check-circle"></i> ¡Anuncio publicado exitosamente!</h5>
        <p>Tu solicitud de compra ha sido publicada.</p>
        <button class="btn btn-success btn-sm" (click)="verAnuncios()">Ver anuncios</button>
      </div>

      <div class="alert alert-danger" *ngIf="errorMensaje">
        <h5><i class="fas fa-exclamation-triangle"></i> Error al publicar</h5>
        <p>{{ errorMensaje }}</p>
        <button class="btn btn-outline-danger btn-sm" (click)="limpiarError()">Reintentar</button>
      </div>
    </div>
  `,
  styles: [`
    .crear-anuncio-compra-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }

    .header {
      text-align: center;
      margin-bottom: 2rem;
    }

    .header h2 {
      color: #2c3e50;
      margin-bottom: 0.5rem;
      font-weight: 600;
    }

    .header i {
      color: #e67e22;
      margin-right: 0.5rem;
    }

    .anuncio-form {
      background: white;
      padding: 2rem;
      border-radius: 12px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    }

    .form-group {
      margin-bottom: 1.5rem;
    }

    .form-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1rem;
    }

    .form-group label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: 500;
      color: #2c3e50;
    }

    .required::after {
      content: ' *';
      color: #e74c3c;
    }

    .form-control {
      width: 100%;
      padding: 0.75rem;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.3s;
    }

    .form-control:focus {
      outline: none;
      border-color: #e67e22;
    }

    .producto-search-container {
      position: relative;
    }

    .search-results {
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: white;
      border: 2px solid #ecf0f1;
      border-radius: 8px;
      max-height: 300px;
      overflow-y: auto;
      z-index: 1000;
    }

    .search-result-item {
      padding: 1rem;
      border-bottom: 1px solid #ecf0f1;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .search-result-item:hover {
      background-color: #f8f9fa;
    }

    .producto-info {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .producto-imagen {
      width: 50px;
      height: 50px;
      object-fit: cover;
      border-radius: 8px;
    }

    .producto-details h4 {
      margin: 0;
      font-size: 1rem;
      color: #2c3e50;
    }

    .precio-ref {
      color: #27ae60;
      font-weight: 500;
      font-size: 0.875rem;
    }

    .producto-seleccionado {
      margin: 1.5rem 0;
      padding: 1rem;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .producto-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      background: white;
      padding: 1rem;
      border-radius: 8px;
    }

    .producto-card img {
      width: 80px;
      height: 80px;
      object-fit: cover;
      border-radius: 8px;
    }

    .input-group {
      display: flex;
      align-items: center;
    }

    .input-group-text {
      background: #f8f9fa;
      border: 2px solid #ecf0f1;
      padding: 0.75rem 1rem;
      color: #6c757d;
      font-weight: 500;
      border-radius: 8px 0 0 8px;
    }

    .input-group .form-control {
      border-radius: 0 8px 8px 0;
      border-left: none;
    }

    .form-actions {
      display: flex;
      gap: 1rem;
      justify-content: flex-end;
      margin-top: 2rem;
    }

    .btn {
      padding: 0.75rem 2rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s;
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-primary {
      background: #e67e22;
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background: #d35400;
      transform: translateY(-2px);
    }

    .btn-secondary {
      background: #95a5a6;
      color: white;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-top: 2rem;
    }

    .alert-success {
      background: #d5f4e6;
      border: 2px solid #27ae60;
      color: #16a085;
    }

    .alert-danger {
      background: #fadbd8;
      border: 2px solid #e74c3c;
      color: #c0392b;
    }

    @media (max-width: 768px) {
      .crear-anuncio-compra-container {
        padding: 1rem;
      }

      .form-row {
        grid-template-columns: 1fr;
      }

      .form-actions {
        flex-direction: column;
      }
    }
  `]
})
export class CrearAnuncioCompraComponent implements OnInit {
  anuncioForm: FormGroup;
  productosEncontrados: Producto[] = [];
  productoSeleccionado: Producto | null = null;
  productoSeleccionadoId: number | null = null;
  mostrarResultados = false;
  cargando = false;
  anuncioCreado = false;
  errorMensaje = '';

  constructor(
    private fb: FormBuilder,
    private anunciosService: AnunciosService,
    private productosService: ProductosService,
    private router: Router
  ) {
    this.anuncioForm = this.fb.group({
      id_producto: ['', [Validators.required]],
      cantidad: ['', [Validators.required, Validators.min(0.01)]],
      unidad: ['', [Validators.required]],
      precio_ofertado: ['', [Validators.required, Validators.min(0.01)]],
      descripcion: ['']
    });
  }

  ngOnInit(): void {
    // Auto-rellenar unidad cuando se selecciona un producto
    this.anuncioForm.get('id_producto')?.valueChanges.subscribe(() => {
      if (this.productoSeleccionado?.unidad_medida) {
        this.anuncioForm.patchValue({
          unidad: this.productoSeleccionado.unidad_medida
        });
      }
    });
  }

  onProductoSearch(event: any): void {
    const query = event.target.value?.trim();

    if (query && query.length >= 2) {
      this.productosService.getProductos({ search: query, limit: 10 })
        .pipe(
          debounceTime(300),
          distinctUntilChanged()
        )
        .subscribe({
          next: (response) => {
            this.productosEncontrados = response.productos || [];
            this.mostrarResultados = true;
          },
          error: () => {
            this.productosEncontrados = [];
            this.mostrarResultados = false;
          }
        });
    } else {
      this.productosEncontrados = [];
      this.mostrarResultados = false;
    }
  }  seleccionarProducto(producto: Producto): void {
    const id = (producto as any).id_producto ?? producto.id;
    this.productoSeleccionado = producto;
    this.productoSeleccionadoId = Number(id);
    this.anuncioForm.patchValue({
      id_producto: this.productoSeleccionadoId,
      unidad: producto.unidad_medida
    });
    this.mostrarResultados = false;
    this.productosEncontrados = [];
  }

  onSubmit(): void {
    // Validar explícitamente que id_producto sea un número válido
    if ((this.anuncioForm.valid && !this.cargando) && this.productoValido) {
      this.cargando = true;
      this.errorMensaje = '';

      // Cast numéricos explícitamente
      const raw = this.anuncioForm.value;
      const anuncioData: AnuncioCompraRequest = {
        id_producto: Number(raw.id_producto),
        cantidad: Number(raw.cantidad),
        unidad: raw.unidad,
        precio_ofertado: Number(raw.precio_ofertado),
        descripcion: raw.descripcion
      };

      // Log de payload y advertencia de campos
      const missing = [];
      if (!anuncioData.id_producto) missing.push('id_producto');
      if (!anuncioData.cantidad) missing.push('cantidad');
      if (!anuncioData.unidad) missing.push('unidad');
      if (!anuncioData.precio_ofertado) missing.push('precio_ofertado');
      console.log('[ANUNCIO COMPRA] Payload enviado:', anuncioData);
      if (missing.length > 0) {
        console.warn('[ANUNCIO COMPRA] Faltan campos obligatorios:', missing.join(', '));
      }

      this.anunciosService.crearAnuncioCompra(anuncioData)
        .pipe(
          finalize(() => this.cargando = false)
        )
        .subscribe({
          next: (_response: AnuncioCompraResponse) => {
            this.anuncioCreado = true;
            this.anuncioForm.reset();
            this.productoSeleccionado = null;
          },
          error: (error) => {
            this.errorMensaje = error.error?.mensaje ||
                             error.message ||
                             'Error al crear el anuncio. Por favor, intenta nuevamente.';
            if (error.error?.details) {
              console.error('[ANUNCIO COMPRA] Detalles de error del backend:', error.error.details);
            }
          }
        });
    }
  }

  // Getter para validar si el producto seleccionado es válido
  get productoValido(): boolean {
    const id = this.anuncioForm.get('id_producto')?.value;
    return id !== null && id !== '' && !isNaN(Number(id)) && Number(id) > 0;
  }

  cancelar(): void {
    this.router.navigate(['/anuncios/compra']);
  }

  verAnuncios(): void {
    this.router.navigate(['/anuncios/compra']);
  }

  limpiarError(): void {
    this.errorMensaje = '';
    this.anuncioCreado = false;
  }

  quitarSeleccionProducto(): void {
    this.productoSeleccionado = null;
    this.anuncioForm.patchValue({ id_producto: null });
    this.mostrarResultados = false;
  }
}
