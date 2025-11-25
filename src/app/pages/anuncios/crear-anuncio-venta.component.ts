import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AnunciosService } from '../../core/services/anuncios.service';
import { ProductosService, Producto } from '../../core/services/productos.service';

@Component({
  selector: 'app-crear-anuncio-venta',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="crear-anuncio-container">
      <div class="header">
        <h1>Crear Anuncio de Venta</h1>
        <p class="subtitle">Publica tu producto para que los compradores lo encuentren</p>
      </div>

      <div class="form-container">
        <!-- Loading -->
        <div *ngIf="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>Cargando productos...</p>
        </div>

        <!-- Error -->
        <div *ngIf="error && !loading" class="error-state">
          <div class="error-icon">⚠️</div>
          <p>{{ error }}</p>
          <button class="btn-retry" (click)="cargarProductos()">Reintentar</button>
        </div>

        <!-- Formulario -->
        <form *ngIf="!loading && !error" [formGroup]="anuncioForm" (ngSubmit)="onSubmit()" class="anuncio-form">

          <!-- Selección de producto -->
          <div class="form-group">
            <label for="id_producto">Producto *</label>
            <select formControlName="id_producto" id="id_producto" class="form-control">
              <option value="">Selecciona un producto</option>
              <option *ngFor="let producto of productos" [value]="producto.id_producto">
                {{ producto.nombre }} ({{ producto.unidad_medida }})
              </option>
            </select>
            <div *ngIf="anuncioForm.get('id_producto')?.invalid && anuncioForm.get('id_producto')?.touched" class="error-message">
              Debes seleccionar un producto
            </div>
          </div>

          <!-- Información del producto seleccionado -->
          <div *ngIf="productoSeleccionado" class="producto-info">
            <h3>Información del producto</h3>
            <div class="producto-card">
              <div class="producto-details">
                <h4>{{ productoSeleccionado.nombre }}</h4>
                <p>{{ productoSeleccionado.descripcion }}</p>
                <p class="precio-referencial">
                  Precio referencial: S/ {{ productoSeleccionado.precio_referencial | number:'1.2-2' }}
                  por {{ productoSeleccionado.unidad_medida }}
                </p>
              </div>
            </div>
          </div>

          <!-- Cantidad y unidad -->
          <div class="form-row">
            <div class="form-group">
              <label for="cantidad">Cantidad disponible *</label>
              <input
                type="number"
                formControlName="cantidad"
                id="cantidad"
                class="form-control"
                placeholder="Ej: 100"
                min="0.1"
                step="0.1">
              <div *ngIf="anuncioForm.get('cantidad')?.invalid && anuncioForm.get('cantidad')?.touched" class="error-message">
                La cantidad debe ser mayor a 0
              </div>
            </div>

            <div class="form-group">
              <label for="unidad">Unidad de medida *</label>
              <select formControlName="unidad" id="unidad" class="form-control">
                <option value="">Selecciona unidad</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="lb">Libras (lb)</option>
                <option value="ton">Toneladas (ton)</option>
                <option value="g">Gramos (g)</option>
                <option value="unidad">Unidades</option>
                <option value="caja">Cajas</option>
                <option value="saco">Sacos</option>
                <option value="litro">Litros</option>
              </select>
              <div *ngIf="anuncioForm.get('unidad')?.invalid && anuncioForm.get('unidad')?.touched" class="error-message">
                Debes seleccionar una unidad
              </div>
            </div>
          </div>

          <!-- Precio -->
          <div class="form-group">
            <label for="precio">Precio de venta (S/) *</label>
            <input
              type="number"
              formControlName="precio"
              id="precio"
              class="form-control"
              placeholder="Ej: 250.00"
              min="0.01"
              step="0.01">
            <small class="form-text">Precio por unidad de medida seleccionada</small>
            <div *ngIf="anuncioForm.get('precio')?.invalid && anuncioForm.get('precio')?.touched" class="error-message">
              El precio debe ser mayor a 0
            </div>
          </div>

          <!-- Descripción -->
          <div class="form-group">
            <label for="descripcion">Descripción del producto *</label>
            <textarea
              formControlName="descripcion"
              id="descripcion"
              class="form-control"
              rows="4"
              placeholder="Describe tu producto: calidad, origen, características especiales...">
            </textarea>
            <div *ngIf="anuncioForm.get('descripcion')?.invalid && anuncioForm.get('descripcion')?.touched" class="error-message">
              La descripción es requerida
            </div>
          </div>

          <!-- Ubicación con Google Maps -->
          <div class="form-group">
            <label for="ubicacion">Ubicación *</label>
            <input
              type="text"
              formControlName="ubicacion"
              id="ubicacion"
              class="form-control"
              placeholder="Ej: Cochabamba, Bolivia">
            <small class="form-text">Ciudad, región o dirección donde se encuentra el producto</small>
            <div *ngIf="anuncioForm.get('ubicacion')?.invalid && anuncioForm.get('ubicacion')?.touched" class="error-message">
              La ubicación es requerida
            </div>
          </div>
          <div class="form-group">
            <label>Selecciona la ubicación en el mapa</label>
            <div #mapContainer id="map" style="width: 100%; height: 300px; border-radius: 8px; margin-bottom: 8px;"></div>
            <div class="text-xs text-gray-500">Haz clic en el mapa para seleccionar la ubicación. Se rellenarán latitud y longitud automáticamente.</div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label for="ubicacion_lat">Latitud</label>
              <input
                type="number"
                formControlName="ubicacion_lat"
                id="ubicacion_lat"
                class="form-control"
                placeholder="-17.3935"
                step="0.000001"
                readonly>
            </div>
            <div class="form-group">
              <label for="ubicacion_lng">Longitud</label>
              <input
                type="number"
                formControlName="ubicacion_lng"
                id="ubicacion_lng"
                class="form-control"
                placeholder="-66.1570"
                step="0.000001"
                readonly>
            </div>
          </div>

          <!-- Resumen -->
          <div class="resumen-anuncio" *ngIf="anuncioForm.value.id_producto && anuncioForm.value.cantidad && anuncioForm.value.precio">
            <h3>Resumen del anuncio</h3>
            <div class="resumen-content">
              <div class="resumen-item">
                <span class="label">Producto:</span>
                <span class="value">{{ productoSeleccionado?.nombre }}</span>
              </div>
              <div class="resumen-item">
                <span class="label">Cantidad:</span>
                <span class="value">{{ anuncioForm.value.cantidad }} {{ anuncioForm.value.unidad }}</span>
              </div>
              <div class="resumen-item">
                <span class="label">Precio total:</span>
                <span class="value precio-total">
                  S/ {{ (anuncioForm.value.cantidad * anuncioForm.value.precio) | number:'1.2-2' }}
                </span>
              </div>
              <div class="resumen-item">
                <span class="label">Precio por {{ anuncioForm.value.unidad }}:</span>
                <span class="value">S/ {{ anuncioForm.value.precio | number:'1.2-2' }}</span>
              </div>
            </div>
          </div>

          <!-- Botones -->
          <div class="form-actions">
            <button type="button" class="btn-cancel" (click)="cancelar()">
              Cancelar
            </button>
            <button type="submit" class="btn-submit" [disabled]="anuncioForm.invalid || submitting">
              <span *ngIf="submitting">Creando...</span>
              <span *ngIf="!submitting">Crear Anuncio</span>
            </button>
          </div>
        </form>

        <!-- Success State -->
        <div *ngIf="anuncioCreado" class="success-state">
          <div class="success-icon">✅</div>
          <h3>¡Anuncio creado exitosamente!</h3>
          <p>Tu anuncio ha sido publicado y ya está disponible para los compradores.</p>
          <div class="success-actions">
            <button class="btn-primary" (click)="crearOtroAnuncio()">
              Crear otro anuncio
            </button>
            <button class="btn-secondary" (click)="verMisAnuncios()">
              Ver mis anuncios
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styleUrl: './crear-anuncio-venta.component.scss'
})
export class CrearAnuncioVentaComponent implements OnInit, OnDestroy, AfterViewInit {
  ngAfterViewInit(): void {
    this.loadGoogleMapsScript().then(() => {
      // Esperar a que los productos estén cargados y el contenedor del mapa esté listo
      setTimeout(() => {
        if (this.productos.length > 0 && this.mapContainer) {
          this.initMap();
        } else {
          // Reintentar cuando los productos terminen de cargar
          const sub = this.anuncioForm.get('id_producto')?.valueChanges.subscribe(() => {
            if (this.productos.length > 0 && this.mapContainer) {
              this.initMap();
              sub?.unsubscribe();
            }
          });
        }
      }, 0);
    });
  }
      @ViewChild('mapContainer', { static: false }) public mapContainer!: ElementRef;
      public map: any;
      public marker: any;
    // Métodos y getters públicos para el template
    public cargarProductos = this._cargarProductos.bind(this);
    public get productoSeleccionado() { return this._productoSeleccionado(); }
    public get productoValidoVenta() { return this._productoValidoVenta(); }
    public cancelar = this._cancelar.bind(this);
    public crearOtroAnuncio = this._crearOtroAnuncio.bind(this);
    public verMisAnuncios = this._verMisAnuncios.bind(this);

    // Métodos originales renombrados a privados
  private _cargarProductos(): void {
    this.loading = true;
    this.error = null;
    const sub = this.productosService.getCatalogo(1).subscribe({
      next: (response) => {
        this.productos = response.productos;
        this.loading = false;
        // Si el mapa ya está cargado, forzar re-render
        if (this.mapContainer && (window as any).google && (window as any).google.maps) {
          setTimeout(() => this.initMap(), 0);
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.error = 'Error al cargar los productos. Por favor, intenta de nuevo.';
        this.loading = false;
      }
    });
    this.subscriptions.push(sub);
  }

    private _onSubmit(): void {
      if (this.anuncioForm.valid && !this.submitting) {
        this.submitting = true;
        const values = this.anuncioForm.value;
        const id = (values.id_producto as any)?.id_producto ?? values.id_producto;
        const anuncioData: any = {
          id_producto: Number(id),
          cantidad: Number(values.cantidad),
          unidad: values.unidad,
          precio: Number(values.precio)
        };
        if (values.descripcion) anuncioData.descripcion = values.descripcion;
        if (values.ubicacion) anuncioData.ubicacion = values.ubicacion;
        if (values.ubicacion_lat !== null && values.ubicacion_lat !== undefined && values.ubicacion_lat !== '') anuncioData.ubicacion_lat = Number(values.ubicacion_lat);
        if (values.ubicacion_lng !== null && values.ubicacion_lng !== undefined && values.ubicacion_lng !== '') anuncioData.ubicacion_lng = Number(values.ubicacion_lng);
        // Debug visual
        console.log('Debug: id_producto=', anuncioData.id_producto, '| productoValido=', !isNaN(anuncioData.id_producto) && anuncioData.id_producto > 0, '| Form valid=', this.anuncioForm.valid);
        const sub = this.anunciosService.crearAnuncioVenta(anuncioData).subscribe({
          next: (response) => {
            console.log('Anuncio creado:', response);
            this.anuncioCreado = true;
            this.submitting = false;
          },
          error: (error) => {
            console.error('Error creating announcement:', error);
            if (error?.error?.details && Array.isArray(error.error.details)) {
              this.error = error.error.details.join(' | ');
            } else if (error?.error?.mensaje) {
              this.error = error.error.mensaje;
            } else {
              this.error = error.message || 'Error al crear el anuncio. Por favor, intenta de nuevo.';
            }
            this.submitting = false;
          }
        });
        this.subscriptions.push(sub);
      }
    }

    private setupFormWatchers(): void {
      const productSub = this.anuncioForm.get('id_producto')?.valueChanges.subscribe(productIdRaw => {
        const productId = Number(productIdRaw);
        if (productId && this.productos.length > 0) {
          const producto = this.productos.find(p => p.id_producto == productId);
          if (producto && producto.unidad_medida) {
            this.anuncioForm.patchValue({
              unidad: producto.unidad_medida
            });
          }
        } else {
          // Si se deselecciona el producto, limpiar unidad
          this.anuncioForm.patchValue({ unidad: '' });
        }
      });
      if (productSub) {
        this.subscriptions.push(productSub);
      }
    }

    private _productoSeleccionado(): Producto | null {
      const idRaw = this.anuncioForm.get('id_producto')?.value;
      const id = Number(idRaw);
      return id ? this.productos.find(p => p.id_producto == id) || null : null;
    }

    private _productoValidoVenta(): boolean {
      const idRaw = this.anuncioForm.get('id_producto')?.value;
      const id = Number(idRaw);
      return idRaw !== null && idRaw !== undefined && idRaw !== '' && !isNaN(id) && id > 0;
    }

    private _cancelar(): void {
      this.router.navigate(['/productos']);
    }

    private _crearOtroAnuncio(): void {
      this.anuncioCreado = false;
      this.anuncioForm.reset();
      this.cargarProductos();
    }

    private _verMisAnuncios(): void {
      this.router.navigate(['/anuncios/mis-anuncios']);
    }
  anuncioForm: FormGroup;
  productos: Producto[] = [];
  loading = false;
  error: string | null = null;
  submitting = false;
  anuncioCreado = false;
  subscriptions: Subscription[] = [];

  constructor(
    private fb: FormBuilder,
    private productosService: ProductosService,
    private anunciosService: AnunciosService,
    private router: Router
  ) {
    this.anuncioForm = this.createForm();
  }

  ngOnInit(): void {
    this.cargarProductos();
    this.setupFormWatchers();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  private createForm(): FormGroup {
    return this.fb.group({
      id_producto: ['', Validators.required],
      cantidad: ['', [Validators.required, Validators.min(0.1)]],
      unidad: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0.01)]],
      descripcion: ['', Validators.required],
      ubicacion: ['', Validators.required],
      ubicacion_lat: [''],
      ubicacion_lng: ['']
    });
  }

  private loadGoogleMapsScript(): Promise<void> {
    return new Promise((resolve) => {
      if ((window as any).google && (window as any).google.maps) {
        resolve();
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyCRKy0FoTSuZtaSKbBu8JBdfVlNWexg1uk';
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      document.body.appendChild(script);
    });
  }

  private initMap(): void {
    if (!this.mapContainer) return;
    const lat = this.anuncioForm.value.ubicacion_lat || -17.3935;
    const lng = this.anuncioForm.value.ubicacion_lng || -66.1570;
    const center = { lat: Number(lat), lng: Number(lng) };
    this.map = new (window as any).google.maps.Map(this.mapContainer.nativeElement, {
      center,
      zoom: 7
    });
    this.marker = new (window as any).google.maps.Marker({
      position: center,
      map: this.map,
      draggable: true
    });
    this.map.addListener('click', (e: any) => {
      this.setMarker(e.latLng.lat(), e.latLng.lng());
    });
    this.marker.addListener('dragend', (e: any) => {
      this.setMarker(e.latLng.lat(), e.latLng.lng());
    });
  }

  private setMarker(lat: number, lng: number): void {
    if (this.marker) {
      this.marker.setPosition({ lat, lng });
    }
    this.anuncioForm.patchValue({
      ubicacion_lat: lat,
      ubicacion_lng: lng
    });
  }

  // 2. Cambiar el método onSubmit para que llame directamente a _onSubmit()
  public onSubmit() {
    if (this.anuncioForm.valid && !this.submitting) {
      this._onSubmit();
    }
  }
}
