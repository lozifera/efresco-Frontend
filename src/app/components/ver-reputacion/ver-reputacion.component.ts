import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReputacionService, ReputacionUsuario } from '../../core/services/reputacion.service';

@Component({
  selector: 'app-ver-reputacion',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-md p-6">
      <div *ngIf="cargando" class="flex items-center justify-center py-8">
        <svg class="animate-spin h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span class="ml-2 text-gray-600">Cargando reputación...</span>
      </div>

      <div *ngIf="!cargando && reputacionUsuario">
        <!-- Header del usuario -->
        <div class="flex items-center space-x-4 mb-6">
          <img
            [src]="reputacionUsuario.usuario.imagen_perfil || 'https://via.placeholder.com/60x60/3b82f6/ffffff?text=' + reputacionUsuario.usuario.nombre.charAt(0)"
            [alt]="reputacionUsuario.usuario.nombre"
            class="w-15 h-15 rounded-full object-cover">
          <div class="flex-1">
            <h3 class="text-xl font-bold text-gray-800">{{ reputacionUsuario.usuario.nombre }}</h3>
            <p class="text-sm text-gray-600">Reputación del vendedor</p>
          </div>
        </div>

        <!-- Estadísticas principales -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div class="bg-green-50 p-4 rounded-lg text-center">
            <div class="flex items-center justify-center mb-2">
              <span class="text-2xl font-bold"
                    [ngClass]="reputacionService.getColorPuntuacion(reputacionUsuario.estadisticas.promedio_puntuacion)">
                {{ reputacionUsuario.estadisticas.promedio_puntuacion.toFixed(1) }}
              </span>
              <span class="ml-1 text-lg text-yellow-400">★</span>
            </div>
            <p class="text-sm text-gray-600">Promedio</p>
          </div>

          <div class="bg-blue-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-blue-600 mb-2">
              {{ reputacionUsuario.estadisticas.total_calificaciones }}
            </div>
            <p class="text-sm text-gray-600">Calificaciones</p>
          </div>

          <div class="bg-purple-50 p-4 rounded-lg text-center">
            <div class="text-2xl font-bold text-purple-600 mb-2">
              {{ reputacionService.getTextoReputacion(reputacionUsuario.estadisticas.promedio_puntuacion) }}
            </div>
            <p class="text-sm text-gray-600">Clasificación</p>
          </div>
        </div>

        <!-- Distribución de estrellas -->
        <div class="mb-6">
          <h4 class="font-semibold text-gray-800 mb-3">Distribución de Calificaciones</h4>
          <div class="space-y-2">
            <div *ngFor="let estrella of getDistribucionArray()"
                 class="flex items-center space-x-3">
              <span class="text-sm font-medium w-12">{{ estrella.numero }}★</span>
              <div class="flex-1 bg-gray-200 rounded-full h-2">
                <div class="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                     [style.width.%]="estrella.porcentaje">
                </div>
              </div>
              <span class="text-sm text-gray-600 w-12">{{ estrella.cantidad }}</span>
              <span class="text-sm text-gray-500 w-8">{{ estrella.porcentaje }}%</span>
            </div>
          </div>
        </div>

        <!-- Calificaciones recientes -->
        <div *ngIf="reputacionUsuario.calificaciones_recientes.length > 0">
          <h4 class="font-semibold text-gray-800 mb-4">Calificaciones Recientes</h4>
          <div class="space-y-4 max-h-96 overflow-y-auto">
            <div *ngFor="let calificacion of reputacionUsuario.calificaciones_recientes"
                 class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <div class="flex justify-between items-start mb-2">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-800">{{ calificacion.calificador?.nombre || 'Usuario Anónimo' }}</span>
                  <div class="flex text-yellow-400">
                    <span *ngFor="let star of [1,2,3,4,5]"
                          [ngClass]="star <= calificacion.puntuacion ? 'text-yellow-400' : 'text-gray-300'">
                      ★
                    </span>
                  </div>
                </div>
                <span class="text-sm text-gray-500">
                  {{ reputacionService.formatearFechaCalificacion(calificacion.fecha_calificacion) }}
                </span>
              </div>
              <p class="text-gray-700 text-sm leading-relaxed">{{ calificacion.comentario }}</p>
              <div class="mt-2 text-xs text-gray-500">
                Pedido #{{ calificacion.id_pedido }}
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje cuando no hay calificaciones -->
        <div *ngIf="reputacionUsuario.calificaciones_recientes.length === 0"
             class="text-center py-8 text-gray-500">
          <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                  d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          <p class="text-lg font-medium">Aún no tiene calificaciones recientes</p>
          <p class="text-sm">Las calificaciones aparecerán aquí una vez que complete sus primeras transacciones.</p>
        </div>
      </div>

      <div *ngIf="!cargando && error" class="text-center py-8">
        <svg class="mx-auto h-12 w-12 text-red-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium text-gray-800 mb-2">Error al cargar la reputación</p>
        <p class="text-sm text-gray-600 mb-4">{{ error }}</p>
        <button
          (click)="cargarReputacion()"
          class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
          Reintentar
        </button>
      </div>
    </div>
  `,
  styles: [`
    .max-h-96 {
      max-height: 24rem;
    }

    /* Animación para las barras de progreso */
    .bg-yellow-400 {
      transition: width 0.6s ease-in-out;
    }

    /* Hover effects */
    .hover\\:bg-gray-50:hover {
      background-color: #f9fafb;
    }
  `]
})
export class VerReputacionComponent implements OnInit, OnChanges {
  @Input() usuarioId: number = 0;
  @Input() mostrarCompacto: boolean = false;

  reputacionUsuario: ReputacionUsuario | null = null;
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
        this.reputacionUsuario = reputacion;
        console.log('Reputación cargada:', reputacion);
      },
      error: (error) => {
        console.error('Error al cargar reputación:', error);
        this.error = 'No se pudo cargar la información de reputación';

        // Fallback con datos de ejemplo para desarrollo
        this.cargarDatosEjemplo();
      },
      complete: () => {
        this.cargando = false;
      }
    });
  }

  getDistribucionArray(): any[] {
    if (!this.reputacionUsuario) return [];

    const distribucion = this.reputacionUsuario.estadisticas.distribucion;
    const total = this.reputacionUsuario.estadisticas.total_calificaciones;

    return [
      {
        numero: 5,
        cantidad: distribucion['5_estrellas'],
        porcentaje: this.reputacionService.calcularPorcentajeDistribucion(distribucion['5_estrellas'], total)
      },
      {
        numero: 4,
        cantidad: distribucion['4_estrellas'],
        porcentaje: this.reputacionService.calcularPorcentajeDistribucion(distribucion['4_estrellas'], total)
      },
      {
        numero: 3,
        cantidad: distribucion['3_estrellas'],
        porcentaje: this.reputacionService.calcularPorcentajeDistribucion(distribucion['3_estrellas'], total)
      },
      {
        numero: 2,
        cantidad: distribucion['2_estrellas'],
        porcentaje: this.reputacionService.calcularPorcentajeDistribucion(distribucion['2_estrellas'], total)
      },
      {
        numero: 1,
        cantidad: distribucion['1_estrella'],
        porcentaje: this.reputacionService.calcularPorcentajeDistribucion(distribucion['1_estrella'], total)
      }
    ];
  }

  private cargarDatosEjemplo(): void {
    // Datos de ejemplo para desarrollo
    this.reputacionUsuario = {
      usuario: {
        id_usuario: this.usuarioId,
        nombre: 'Usuario de Ejemplo',
        imagen_perfil: `https://via.placeholder.com/60x60/3b82f6/ffffff?text=U${this.usuarioId}`
      },
      estadisticas: {
        promedio_puntuacion: 4.7,
        total_calificaciones: 15,
        distribucion: {
          '5_estrellas': 12,
          '4_estrellas': 2,
          '3_estrellas': 1,
          '2_estrellas': 0,
          '1_estrella': 0
        }
      },
      calificaciones_recientes: [
        {
          id: 1,
          id_usuario_calificado: this.usuarioId,
          puntuacion: 5,
          comentario: 'Excelente vendedora, producto de muy buena calidad y entrega puntual. Muy recomendada!',
          fecha_calificacion: '2025-11-23T15:00:00Z',
          id_pedido: 1,
          calificador: {
            nombre: 'Juan Carlos Pérez'
          }
        },
        {
          id: 2,
          id_usuario_calificado: this.usuarioId,
          puntuacion: 5,
          comentario: 'Muy profesional y productos frescos. Cumplió con los tiempos acordados.',
          fecha_calificacion: '2025-11-22T10:30:00Z',
          id_pedido: 2,
          calificador: {
            nombre: 'Ana Silva'
          }
        },
        {
          id: 3,
          id_usuario_calificado: this.usuarioId,
          puntuacion: 4,
          comentario: 'Buen producto, aunque la entrega se demoró un poco más de lo esperado.',
          fecha_calificacion: '2025-11-20T14:15:00Z',
          id_pedido: 3,
          calificador: {
            nombre: 'Roberto López'
          }
        }
      ]
    };
  }
}
