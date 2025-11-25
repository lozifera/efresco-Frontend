import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';

import { FavoritosService } from '../../core/services/favoritos.service';

@Component({
  selector: 'app-boton-favorito',
  standalone: true,
  imports: [CommonModule],
  template: `
    <button
      type="button"
      class="btn-favorito"
      [class.favorito-activo]="esFavorito"
      [class.loading]="cargando"
      [disabled]="cargando"
      (click)="toggleFavorito()"
      [title]="esFavorito ? 'Quitar de favoritos' : 'Agregar a favoritos'"
    >
      <i
        class="fas"
        [class.fa-heart]="esFavorito && !cargando"
        [class.fa-heart-o]="!esFavorito && !cargando"
        [class.fa-spinner]="cargando"
        [class.fa-spin]="cargando"
      ></i>
      <span class="favorito-texto" *ngIf="mostrarTexto">
        {{ esFavorito ? 'En favoritos' : 'Agregar a favoritos' }}
      </span>
    </button>
  `,
  styles: [`
    .btn-favorito {
      background: transparent;
      border: 2px solid #e74c3c;
      color: #e74c3c;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      white-space: nowrap;
    }

    .btn-favorito:hover:not(:disabled) {
      background: #e74c3c;
      color: white;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
    }

    .btn-favorito.favorito-activo {
      background: #e74c3c;
      color: white;
      border-color: #e74c3c;
    }

    .btn-favorito.favorito-activo:hover:not(:disabled) {
      background: #c0392b;
      border-color: #c0392b;
      box-shadow: 0 4px 12px rgba(192, 57, 43, 0.4);
    }

    .btn-favorito:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none;
    }

    .btn-favorito.loading {
      pointer-events: none;
    }

    .btn-favorito i {
      font-size: 1rem;
      transition: transform 0.3s ease;
    }

    .btn-favorito:hover i {
      transform: scale(1.1);
    }

    .favorito-texto {
      font-size: 0.875rem;
    }

    /* Variantes de tamaño */
    .btn-favorito.btn-sm {
      padding: 0.375rem 0.75rem;
      font-size: 0.75rem;
    }

    .btn-favorito.btn-sm i {
      font-size: 0.875rem;
    }

    .btn-favorito.btn-lg {
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
    }

    .btn-favorito.btn-lg i {
      font-size: 1.125rem;
    }

    /* Solo icono */
    .btn-favorito.solo-icono {
      padding: 0.5rem;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      justify-content: center;
    }

    .btn-favorito.solo-icono.btn-sm {
      width: 32px;
      height: 32px;
      padding: 0.375rem;
    }

    .btn-favorito.solo-icono.btn-lg {
      width: 48px;
      height: 48px;
      padding: 0.75rem;
    }

    /* Animación de pulso cuando se agrega a favoritos */
    @keyframes pulso-favorito {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    .btn-favorito.favorito-activo i {
      animation: pulso-favorito 0.6s ease;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .btn-favorito {
        padding: 0.5rem;
        border-radius: 50%;
        width: 40px;
        height: 40px;
        justify-content: center;
      }

      .favorito-texto {
        display: none;
      }
    }
  `]
})
export class BotonFavoritoComponent implements OnInit, OnDestroy {
  @Input() idProducto?: number;
  @Input() idAnuncioVenta?: number;
  @Input() mostrarTexto: boolean = true;
  @Input() tamaño: 'sm' | 'md' | 'lg' = 'md';
  @Input() soloIcono: boolean = false;

  @Output() favoritoToggled = new EventEmitter<{ esFavorito: boolean; mensaje: string }>();
  @Output() error = new EventEmitter<string>();

  esFavorito = false;
  cargando = false;
  private destroy$ = new Subject<void>();

  constructor(private favoritosService: FavoritosService) {}

  ngOnInit(): void {
    this.verificarEstadoFavorito();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private verificarEstadoFavorito(): void {
    if (this.idProducto) {
      this.favoritosService.verificarProductoEnFavoritos(this.idProducto)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (esFavorito) => this.esFavorito = esFavorito,
          error: () => this.esFavorito = false
        });
    } else if (this.idAnuncioVenta) {
      this.favoritosService.verificarAnuncioVentaEnFavoritos(this.idAnuncioVenta)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (esFavorito) => this.esFavorito = esFavorito,
          error: () => this.esFavorito = false
        });
    }
  }

  toggleFavorito(): void {
    if (this.cargando) return;

    this.cargando = true;

    let toggleObservable;

    if (this.idProducto) {
      toggleObservable = this.favoritosService.toggleProductoFavorito(this.idProducto);
    } else if (this.idAnuncioVenta) {
      toggleObservable = this.favoritosService.toggleAnuncioVentaFavorito(this.idAnuncioVenta);
    } else {
      this.cargando = false;
      this.error.emit('No se especificó ID de producto o anuncio');
      return;
    }

    toggleObservable
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => this.cargando = false)
      )
      .subscribe({
        next: (result) => {
          this.esFavorito = result.esFavorito;
          this.favoritoToggled.emit(result);
        },
        error: (error) => {
          const mensajeError = error.error?.mensaje ||
                              error.message ||
                              'Error al actualizar favoritos';
          this.error.emit(mensajeError);
        }
      });
  }

  // Método público para actualizar el estado desde el componente padre
  actualizarEstado(esFavorito: boolean): void {
    this.esFavorito = esFavorito;
  }

  // Getter para las clases CSS
  get clasesCss(): string {
    const clases = ['btn-favorito'];

    if (this.esFavorito) {
      clases.push('favorito-activo');
    }

    if (this.cargando) {
      clases.push('loading');
    }

    if (this.tamaño !== 'md') {
      clases.push(`btn-${this.tamaño}`);
    }

    if (this.soloIcono) {
      clases.push('solo-icono');
    }

    return clases.join(' ');
  }
}
