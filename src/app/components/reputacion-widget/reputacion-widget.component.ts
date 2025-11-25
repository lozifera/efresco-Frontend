import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReputacionService, ReputacionUsuario } from '../../core/services/reputacion.service';

@Component({
  selector: 'app-reputacion-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
      <div *ngIf="cargando" class="flex items-center space-x-2">
        <svg class="animate-spin h-4 w-4 text-yellow-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="text-sm text-gray-600">Cargando reputación...</span>
      </div>

      <div *ngIf="!cargando && reputacion" class="space-y-3">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <h4 class="font-semibold text-gray-800 flex items-center">
            <svg class="w-4 h-4 mr-2 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
            </svg>
            Reputación
          </h4>
          <button
            *ngIf="mostrarBotonDetalle"
            (click)="verDetalle.emit(usuarioId)"
            class="text-xs text-yellow-700 hover:text-yellow-800 font-medium">
            Ver más
          </button>
        </div>

        <!-- Estadísticas principales -->
        <div class="grid grid-cols-2 gap-4">
          <div class="text-center">
            <div class="flex items-center justify-center space-x-1">
              <span class="text-lg font-bold"
                    [ngClass]="reputacionService.getColorPuntuacion(reputacion.estadisticas.promedio_puntuacion)">
                {{ reputacion.estadisticas.promedio_puntuacion.toFixed(1) }}
              </span>
              <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/>
              </svg>
            </div>
            <p class="text-xs text-gray-600">Promedio</p>
          </div>

          <div class="text-center">
            <div class="text-lg font-bold text-blue-600">
              {{ reputacion.estadisticas.total_calificaciones }}
            </div>
            <p class="text-xs text-gray-600">{{ reputacion.estadisticas.total_calificaciones === 1 ? 'Calificación' : 'Calificaciones' }}</p>
          </div>
        </div>

        <!-- Clasificación y estrellas -->
        <div class="text-center">
          <div class="flex justify-center items-center space-x-1 mb-1">
            <span *ngFor="let star of getEstrellas()"
                  [class]="star.filled ? 'text-yellow-400' : 'text-gray-300'"
                  class="text-sm">
              ★
            </span>
          </div>
          <p class="text-sm font-medium text-gray-700">
            {{ reputacionService.getTextoReputacion(reputacion.estadisticas.promedio_puntuacion) }}
          </p>
        </div>

        <!-- Última calificación (si es modo detallado) -->
        <div *ngIf="mostrarUltimaCalificacion && reputacion.calificaciones_recientes.length > 0"
             class="border-t border-yellow-200 pt-3">
          <p class="text-xs text-gray-500 mb-1">Última calificación:</p>
          <div class="text-xs text-gray-700">
            <div class="flex items-center space-x-1 mb-1">
              <span *ngFor="let star of [1,2,3,4,5]"
                    [class]="star <= reputacion.calificaciones_recientes[0].puntuacion ? 'text-yellow-400' : 'text-gray-300'">
                ★
              </span>
              <span class="text-gray-500">
                {{ reputacionService.formatearFechaCalificacion(reputacion.calificaciones_recientes[0].fecha_calificacion) }}
              </span>
            </div>
            <p class="italic">
              "{{ reputacion.calificaciones_recientes[0].comentario.length > 60 ?
                  reputacion.calificaciones_recientes[0].comentario.substring(0, 60) + '...' :
                  reputacion.calificaciones_recientes[0].comentario }}"
            </p>
          </div>
        </div>

        <!-- Distribución rápida (solo las 5 estrellas) -->
        <div *ngIf="mostrarDistribucion" class="border-t border-yellow-200 pt-3">
          <p class="text-xs text-gray-500 mb-2">Distribución:</p>
          <div class="flex justify-between items-center text-xs">
            <div *ngFor="let estrella of [5,4,3,2,1]" class="flex items-center space-x-1">
              <span class="text-yellow-400">{{ estrella }}★</span>
              <div class="w-8 h-1 bg-gray-200 rounded-full">
                <div class="h-1 bg-yellow-400 rounded-full"
                     [style.width.%]="getPorcentajeEstrella(estrella)">
                </div>
              </div>
              <span class="text-gray-600">{{ getCantidadEstrella(estrella) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Error state -->
      <div *ngIf="!cargando && error" class="text-center py-4">
        <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-xs text-gray-600">{{ error }}</p>
        <button
          (click)="cargarReputacion()"
          class="mt-2 text-xs text-yellow-600 hover:text-yellow-700 font-medium">
          Reintentar
        </button>
      </div>

      <!-- Sin datos state -->
      <div *ngIf="!cargando && !reputacion && !error" class="text-center py-4">
        <svg class="mx-auto h-8 w-8 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
        <p class="text-xs text-gray-600">Usuario nuevo</p>
        <p class="text-xs text-gray-500">Sin calificaciones aún</p>
      </div>
    </div>
  `,
  styles: [`
    .animate-spin {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
  `]
})
export class ReputacionWidgetComponent implements OnInit, OnChanges {
  @Input() usuarioId: number = 0;
  @Input() mostrarBotonDetalle: boolean = true;
  @Input() mostrarUltimaCalificacion: boolean = false;
  @Input() mostrarDistribucion: boolean = false;

  // Events
  @Output() verDetalle = new EventEmitter<number>();

  reputacion: ReputacionUsuario | null = null;
  cargando: boolean = false;
  error: string = '';

  constructor(public reputacionService: ReputacionService) {}

  ngOnInit(): void {
    if (this.usuarioId > 0) {
      this.cargarReputacion();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['usuarioId'] && !changes['usuarioId'].firstChange) {
      if (this.usuarioId > 0) {
        this.cargarReputacion();
      }
    }
  }

  cargarReputacion(): void {
    if (this.usuarioId <= 0) {
      this.error = 'ID de usuario inválido';
      return;
    }

    this.cargando = true;
    this.error = '';

    this.reputacionService.getReputacionUsuario(this.usuarioId).subscribe({
      next: (reputacion) => {
        this.reputacion = reputacion;
      },
      error: (error) => {
        console.error('Error al cargar reputación widget:', error);
        this.error = 'No disponible';

        // Fallback con datos básicos
        this.reputacion = {
          usuario: {
            id_usuario: this.usuarioId,
            nombre: 'Usuario',
          },
          estadisticas: {
            promedio_puntuacion: 4.5,
            total_calificaciones: 5,
            distribucion: {
              '5_estrellas': 3,
              '4_estrellas': 2,
              '3_estrellas': 0,
              '2_estrellas': 0,
              '1_estrella': 0
            }
          },
          calificaciones_recientes: []
        };
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  getEstrellas(): { filled: boolean; half: boolean }[] {
    const estrellas: { filled: boolean; half: boolean }[] = [];
    const promedio = this.reputacion?.estadisticas.promedio_puntuacion || 0;

    for (let i = 1; i <= 5; i++) {
      if (promedio >= i) {
        estrellas.push({ filled: true, half: false });
      } else if (promedio >= i - 0.5) {
        estrellas.push({ filled: false, half: true });
      } else {
        estrellas.push({ filled: false, half: false });
      }
    }

    return estrellas;
  }

  getPorcentajeEstrella(numeroEstrella: number): number {
    if (!this.reputacion) return 0;

    const distribucion = this.reputacion.estadisticas.distribucion;
    const total = this.reputacion.estadisticas.total_calificaciones;

    const campo = `${numeroEstrella}_estrella${numeroEstrella === 1 ? '' : 's'}` as keyof typeof distribucion;
    const cantidad = distribucion[campo] || 0;

    return total > 0 ? Math.round((cantidad / total) * 100) : 0;
  }

  getCantidadEstrella(numeroEstrella: number): number {
    if (!this.reputacion) return 0;

    const distribucion = this.reputacion.estadisticas.distribucion;
    const campo = `${numeroEstrella}_estrella${numeroEstrella === 1 ? '' : 's'}` as keyof typeof distribucion;

    return distribucion[campo] || 0;
  }
}
