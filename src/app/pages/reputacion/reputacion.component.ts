import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReputacionService, ReputacionUsuario, Calificacion } from '../../core/services/reputacion.service';
import { CalificarUsuarioComponent } from '../../components/calificar-usuario/calificar-usuario.component';
import { VerReputacionComponent } from '../../components/ver-reputacion/ver-reputacion.component';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-reputacion',
  standalone: true,
  imports: [CommonModule, FormsModule, CalificarUsuarioComponent, VerReputacionComponent],
  template: `
    <div class="min-h-screen bg-gray-50 py-8">
      <div class="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <!-- Header -->
        <div class="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div class="flex flex-col md:flex-row md:items-center md:justify-between">
            <div>
              <h1 class="text-2xl font-bold text-gray-900">Sistema de Reputación</h1>
              <p class="mt-1 text-sm text-gray-600">Gestiona calificaciones y consulta reputaciones</p>
            </div>

            <div class="mt-4 md:mt-0 flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
              <button
                (click)="vistaActual = 'mis-calificaciones'"
                [class]="vistaActual === 'mis-calificaciones' ? 'bg-green-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-green-50">
                Mis Calificaciones
              </button>
              <button
                (click)="vistaActual = 'pendientes'"
                [class]="vistaActual === 'pendientes' ? 'bg-yellow-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-yellow-50">
                Pendientes ({{ pedidosPendientes.length }})
              </button>
              <button
                (click)="vistaActual = 'buscar'"
                [class]="vistaActual === 'buscar' ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 border border-gray-300'"
                class="px-4 py-2 rounded-lg font-medium transition-colors hover:bg-blue-50">
                Buscar Usuario
              </button>
            </div>
          </div>
        </div>

        <!-- Vista de Mis Calificaciones -->
        <div *ngIf="vistaActual === 'mis-calificaciones'" class="bg-white rounded-lg shadow-sm">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Calificaciones Recibidas</h2>
            <p class="text-sm text-gray-600">Mira qué piensan otros usuarios sobre ti</p>
          </div>

          <div class="p-6" *ngIf="!cargandoMisCalificaciones">
            <div *ngIf="misCalificaciones.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">Aún no tienes calificaciones</h3>
              <p class="mt-1 text-sm text-gray-500">Completa algunas transacciones para recibir tus primeras calificaciones.</p>
            </div>

            <div *ngIf="misCalificaciones.length > 0" class="space-y-4">
              <div *ngFor="let calificacion of misCalificaciones"
                   class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center space-x-3">
                    <img
                      [src]="calificacion.calificador?.imagen_perfil || 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=' + calificacion.calificador?.nombre?.charAt(0)"
                      [alt]="calificacion.calificador?.nombre"
                      class="w-10 h-10 rounded-full object-cover">
                    <div>
                      <h4 class="font-medium text-gray-900">{{ calificacion.calificador?.nombre || 'Usuario Anónimo' }}</h4>
                      <p class="text-sm text-gray-500">Pedido #{{ calificacion.id_pedido }}</p>
                    </div>
                  </div>
                  <div class="text-right">
                    <div class="flex items-center text-yellow-400">
                      <span *ngFor="let star of [1,2,3,4,5]"
                            [class]="star <= calificacion.puntuacion ? 'text-yellow-400' : 'text-gray-300'">
                        ★
                      </span>
                      <span class="ml-2 text-sm text-gray-600">({{ calificacion.puntuacion }}/5)</span>
                    </div>
                    <p class="text-xs text-gray-500">{{ reputacionService.formatearFechaCalificacion(calificacion.fecha_calificacion) }}</p>
                  </div>
                </div>
                <p class="text-gray-700 leading-relaxed">{{ calificacion.comentario }}</p>
              </div>
            </div>
          </div>

          <div *ngIf="cargandoMisCalificaciones" class="flex items-center justify-center py-12">
            <svg class="animate-spin h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <span class="ml-2 text-gray-600">Cargando mis calificaciones...</span>
          </div>
        </div>

        <!-- Vista de Calificaciones Pendientes -->
        <div *ngIf="vistaActual === 'pendientes'" class="bg-white rounded-lg shadow-sm">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Calificaciones Pendientes</h2>
            <p class="text-sm text-gray-600">Usuarios que aún no has calificado</p>
          </div>

          <div class="p-6">
            <div *ngIf="pedidosPendientes.length === 0" class="text-center py-12">
              <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h3 class="mt-2 text-sm font-medium text-gray-900">¡Todo al día!</h3>
              <p class="mt-1 text-sm text-gray-500">No tienes calificaciones pendientes por dar.</p>
            </div>

            <div *ngIf="pedidosPendientes.length > 0" class="space-y-4">
              <div *ngFor="let pedido of pedidosPendientes"
                   class="border border-gray-200 rounded-lg p-4">
                <div class="flex items-center justify-between">
                  <div class="flex items-center space-x-4">
                    <img
                      [src]="pedido.usuario_calificar.imagen_perfil || 'https://via.placeholder.com/50x50/3b82f6/ffffff?text=' + pedido.usuario_calificar.nombre.charAt(0)"
                      [alt]="pedido.usuario_calificar.nombre"
                      class="w-12 h-12 rounded-full object-cover">
                    <div>
                      <h4 class="font-medium text-gray-900">{{ pedido.usuario_calificar.nombre }}</h4>
                      <p class="text-sm text-gray-600">{{ pedido.producto }}</p>
                      <p class="text-xs text-gray-500">Pedido #{{ pedido.id_pedido }} • Entregado {{ reputacionService.formatearFechaCalificacion(pedido.fecha_entrega) }}</p>
                    </div>
                  </div>

                  <div class="flex space-x-2">
                    <button
                      (click)="verReputacionUsuario(pedido.usuario_calificar.id_usuario)"
                      class="px-3 py-2 text-sm font-medium text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors">
                      Ver Reputación
                    </button>
                    <button
                      (click)="abrirModalCalificarPendiente(pedido)"
                      class="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-lg hover:bg-yellow-700 transition-colors">
                      Calificar Ahora
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Vista de Buscar Usuario -->
        <div *ngIf="vistaActual === 'buscar'" class="bg-white rounded-lg shadow-sm">
          <div class="px-6 py-4 border-b border-gray-200">
            <h2 class="text-lg font-semibold text-gray-900">Buscar Reputación de Usuario</h2>
            <p class="text-sm text-gray-600">Consulta la reputación de cualquier usuario por su ID</p>
          </div>

          <div class="p-6">
            <div class="max-w-md">
              <label for="usuarioId" class="block text-sm font-medium text-gray-700 mb-2">
                ID del Usuario
              </label>
              <div class="flex space-x-3">
                <input
                  type="number"
                  id="usuarioId"
                  [(ngModel)]="usuarioIdBuscar"
                  min="1"
                  class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Ej: 123">
                <button
                  (click)="buscarReputacionUsuario()"
                  [disabled]="!usuarioIdBuscar || usuarioIdBuscar <= 0"
                  class="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed">
                  Buscar
                </button>
              </div>
            </div>

            <div *ngIf="reputacionBuscada" class="mt-6">
              <app-ver-reputacion [usuarioId]="reputacionBuscada.usuario.id_usuario"></app-ver-reputacion>
            </div>
          </div>
        </div>

      </div>
    </div>

    <!-- Modal de Calificar Usuario -->
    <app-calificar-usuario
      [mostrarModal]="mostrarModalCalificar"
      [usuario]="usuarioACalificar"
      [pedidoId]="pedidoACalificar"
      (cerrar)="cerrarModalCalificar()"
      (calificacionEnviada)="onCalificacionEnviada($event)">
    </app-calificar-usuario>

    <!-- Modal de Ver Reputación -->
    <div *ngIf="mostrarReputacionModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div class="bg-white rounded-lg w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center p-6 border-b">
          <h3 class="text-xl font-bold text-gray-800">Reputación del Usuario</h3>
          <button
            (click)="cerrarReputacionModal()"
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>
        <div class="p-6">
          <app-ver-reputacion
            [usuarioId]="usuarioReputacionId">
          </app-ver-reputacion>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .min-h-screen {
      min-height: 100vh;
    }

    /* Transiciones suaves para las vistas */
    .transition-colors {
      transition: background-color 0.2s, color 0.2s;
    }

    /* Hover effects */
    .hover\\:bg-gray-50:hover {
      background-color: #f9fafb;
    }

    /* Animación para el modal */
    .fixed {
      animation: modalEnter 0.2s ease-out;
    }

    @keyframes modalEnter {
      from {
        opacity: 0;
        transform: scale(0.95);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }
  `]
})
export class ReputacionComponent implements OnInit {
  vistaActual: 'mis-calificaciones' | 'pendientes' | 'buscar' = 'mis-calificaciones';

  // Datos
  misCalificaciones: Calificacion[] = [];
  pedidosPendientes: any[] = [];
  reputacionBuscada: ReputacionUsuario | null = null;

  // Estados de carga
  cargandoMisCalificaciones = false;
  cargandoPendientes = false;

  // Variables para modales
  mostrarModalCalificar = false;
  mostrarReputacionModal = false;
  usuarioACalificar: any = null;
  pedidoACalificar: number = 0;
  usuarioReputacionId: number = 0;

  // Búsqueda
  usuarioIdBuscar: number = 0;

  constructor(
    public reputacionService: ReputacionService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargarMisCalificaciones();
    this.cargarPedidosPendientes();
  }

  cargarMisCalificaciones(): void {
    this.cargandoMisCalificaciones = true;

    // Simular carga con datos de ejemplo
    setTimeout(() => {
      this.misCalificaciones = [
        {
          id: 1,
          id_usuario_calificado: 1,
          puntuacion: 5,
          comentario: 'Excelente comprador, muy puntual y responsable.',
          fecha_calificacion: '2025-11-23T10:00:00Z',
          id_pedido: 1,
          calificador: {
            nombre: 'María González',
            imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
          }
        },
        {
          id: 2,
          id_usuario_calificado: 1,
          puntuacion: 4,
          comentario: 'Buena comunicación y transacción sin problemas.',
          fecha_calificacion: '2025-11-22T14:30:00Z',
          id_pedido: 2,
          calificador: {
            nombre: 'Carlos Mendoza',
            imagen_perfil: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=CM'
          }
        }
      ];
      this.cargandoMisCalificaciones = false;
    }, 1000);
  }

  cargarPedidosPendientes(): void {
    this.cargandoPendientes = true;

    // Simular carga con datos de ejemplo
    setTimeout(() => {
      this.pedidosPendientes = [
        {
          id_pedido: 1,
          usuario_calificar: {
            id_usuario: 2,
            nombre: 'María González',
            imagen_perfil: 'https://via.placeholder.com/50x50/3b82f6/ffffff?text=MG'
          },
          producto: 'Tomates frescos',
          fecha_entrega: '2025-11-20T16:00:00Z'
        },
        {
          id_pedido: 3,
          usuario_calificar: {
            id_usuario: 4,
            nombre: 'Ana Silva',
            imagen_perfil: 'https://via.placeholder.com/50x50/f59e0b/ffffff?text=AS'
          },
          producto: 'Quinua Real',
          fecha_entrega: '2025-11-21T09:00:00Z'
        }
      ];
      this.cargandoPendientes = false;
    }, 800);
  }

  abrirModalCalificarPendiente(pedido: any): void {
    this.usuarioACalificar = pedido.usuario_calificar;
    this.pedidoACalificar = pedido.id_pedido;
    this.mostrarModalCalificar = true;
  }

  cerrarModalCalificar(): void {
    this.mostrarModalCalificar = false;
    this.usuarioACalificar = null;
    this.pedidoACalificar = 0;
  }

  onCalificacionEnviada(response: any): void {
    console.log('Calificación enviada:', response);
    this.notificationService.show({
      title: '¡Calificación enviada!',
      message: 'Tu calificación ha sido registrada exitosamente',
      type: 'success'
    });

    // Remover el pedido de la lista de pendientes
    this.pedidosPendientes = this.pedidosPendientes.filter(p => p.id_pedido !== this.pedidoACalificar);

    this.cerrarModalCalificar();
  }

  verReputacionUsuario(usuarioId: number): void {
    this.usuarioReputacionId = usuarioId;
    this.mostrarReputacionModal = true;
  }

  cerrarReputacionModal(): void {
    this.mostrarReputacionModal = false;
    this.usuarioReputacionId = 0;
  }

  buscarReputacionUsuario(): void {
    if (!this.usuarioIdBuscar || this.usuarioIdBuscar <= 0) {
      this.notificationService.show({
        title: 'Error',
        message: 'Por favor, ingresa un ID de usuario válido',
        type: 'error'
      });
      return;
    }

    this.reputacionService.getReputacionUsuario(this.usuarioIdBuscar).subscribe({
      next: (reputacion) => {
        this.reputacionBuscada = reputacion;
      },
      error: (error) => {
        console.error('Error al buscar reputación:', error);
        this.notificationService.show({
          title: 'Error',
          message: 'No se pudo encontrar la reputación del usuario',
          type: 'error'
        });
      }
    });
  }
}
