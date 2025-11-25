import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReputacionService, DarCalificacionRequest } from '../../core/services/reputacion.service';

@Component({
  selector: 'app-calificar-usuario',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  template: `
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" *ngIf="mostrarModal">
      <div class="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-xl font-bold text-gray-800">Calificar Usuario</h3>
          <button
            (click)="cerrarModal()"
            class="text-gray-400 hover:text-gray-600 text-2xl leading-none">
            &times;
          </button>
        </div>

        <!-- Información del usuario a calificar -->
        <div class="mb-6 p-4 bg-gray-50 rounded-lg" *ngIf="usuario">
          <div class="flex items-center space-x-3">
            <img
              [src]="usuario.imagen_perfil || 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=' + usuario.nombre.charAt(0)"
              [alt]="usuario.nombre"
              class="w-10 h-10 rounded-full object-cover">
            <div>
              <h4 class="font-semibold text-gray-800">{{ usuario.nombre }}</h4>
              <p class="text-sm text-gray-600">Pedido #{{ pedidoId }}</p>
            </div>
          </div>
        </div>

        <form [formGroup]="calificacionForm" (ngSubmit)="enviarCalificacion()">
          <!-- Puntuación con estrellas -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Puntuación *
            </label>
            <div class="flex items-center space-x-1">
              <button
                *ngFor="let star of [1,2,3,4,5]; index as i"
                type="button"
                (click)="seleccionarPuntuacion(star)"
                class="text-2xl focus:outline-none transition-colors"
                [class]="puntuacionSeleccionada >= star ? 'text-yellow-400' : 'text-gray-300 hover:text-yellow-200'">
                ★
              </button>
            </div>
            <div class="mt-1" *ngIf="puntuacionSeleccionada > 0">
              <span class="text-sm text-gray-600">
                {{ getTextoPuntuacion(puntuacionSeleccionada) }}
              </span>
            </div>
            <div *ngIf="calificacionForm.get('puntuacion')?.invalid && calificacionForm.get('puntuacion')?.touched"
                 class="text-red-500 text-sm mt-1">
              Selecciona una puntuación del 1 al 5
            </div>
          </div>

          <!-- Comentario -->
          <div class="mb-6">
            <label for="comentario" class="block text-sm font-medium text-gray-700 mb-2">
              Comentario *
            </label>
            <textarea
              id="comentario"
              formControlName="comentario"
              rows="4"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
              placeholder="Comparte tu experiencia con este usuario...">
            </textarea>
            <div class="flex justify-between items-center mt-1">
              <div *ngIf="calificacionForm.get('comentario')?.invalid && calificacionForm.get('comentario')?.touched"
                   class="text-red-500 text-sm">
                El comentario debe tener al menos 10 caracteres
              </div>
              <span class="text-sm text-gray-500">
                {{ calificacionForm.get('comentario')?.value?.length || 0 }}/500
              </span>
            </div>
          </div>

          <!-- Errores generales -->
          <div *ngIf="erroresValidacion.length > 0" class="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <ul class="text-red-700 text-sm space-y-1">
              <li *ngFor="let error of erroresValidacion">• {{ error }}</li>
            </ul>
          </div>

          <!-- Mensaje de éxito -->
          <div *ngIf="mostrarExito" class="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p class="text-green-700 text-sm">✓ Calificación enviada exitosamente</p>
          </div>

          <!-- Botones -->
          <div class="flex space-x-3">
            <button
              type="button"
              (click)="cerrarModal()"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 font-medium">
              Cancelar
            </button>
            <button
              type="submit"
              [disabled]="calificacionForm.invalid || enviandoCalificacion"
              class="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium">
              <span *ngIf="!enviandoCalificacion">Enviar Calificación</span>
              <span *ngIf="enviandoCalificacion" class="flex items-center justify-center">
                <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Enviando...
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  `,
  styles: [`
    /* Estilos para las estrellas */
    .estrella-hover {
      transition: all 0.2s ease;
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
export class CalificarUsuarioComponent implements OnInit {
  @Input() mostrarModal: boolean = false;
  @Input() usuario: any = null;
  @Input() pedidoId: number = 0;
  @Output() cerrar = new EventEmitter<void>();
  @Output() calificacionEnviada = new EventEmitter<any>();

  calificacionForm: FormGroup;
  puntuacionSeleccionada: number = 0;
  enviandoCalificacion: boolean = false;
  erroresValidacion: string[] = [];
  mostrarExito: boolean = false;

  constructor(
    private fb: FormBuilder,
    private reputacionService: ReputacionService
  ) {
    this.calificacionForm = this.fb.group({
      puntuacion: [0, [Validators.required, Validators.min(1), Validators.max(5)]],
      comentario: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    // Reset del formulario cuando se abre el modal
    if (this.mostrarModal) {
      this.resetearFormulario();
    }
  }

  seleccionarPuntuacion(puntuacion: number): void {
    this.puntuacionSeleccionada = puntuacion;
    this.calificacionForm.patchValue({
      puntuacion: puntuacion
    });
  }

  getTextoPuntuacion(puntuacion: number): string {
    const textos = {
      1: 'Muy malo',
      2: 'Malo',
      3: 'Regular',
      4: 'Bueno',
      5: 'Excelente'
    };
    return textos[puntuacion as keyof typeof textos] || '';
  }

  enviarCalificacion(): void {
    if (this.calificacionForm.invalid) {
      this.calificacionForm.markAllAsTouched();
      return;
    }

    this.erroresValidacion = [];
    this.enviandoCalificacion = true;

    const request: DarCalificacionRequest = {
      id_usuario_calificado: this.usuario.id_usuario,
      puntuacion: this.calificacionForm.value.puntuacion,
      comentario: this.calificacionForm.value.comentario.trim(),
      id_pedido: this.pedidoId
    };

    // Validación adicional
    const validacion = this.reputacionService.validarCalificacion(request);
    if (!validacion.valido) {
      this.erroresValidacion = validacion.errores;
      this.enviandoCalificacion = false;
      return;
    }

    this.reputacionService.darCalificacion(request).subscribe({
      next: (response) => {
        console.log('Calificación enviada exitosamente:', response);
        this.mostrarExito = true;
        this.calificacionEnviada.emit(response);

        // Cerrar el modal después de 2 segundos
        setTimeout(() => {
          this.cerrarModal();
        }, 2000);
      },
      error: (error) => {
        console.error('Error al enviar calificación:', error);
        this.erroresValidacion = ['Error al enviar la calificación. Por favor, inténtalo de nuevo.'];
      },
      complete: () => {
        this.enviandoCalificacion = false;
      }
    });
  }

  cerrarModal(): void {
    this.resetearFormulario();
    this.cerrar.emit();
  }

  private resetearFormulario(): void {
    this.calificacionForm.reset();
    this.puntuacionSeleccionada = 0;
    this.enviandoCalificacion = false;
    this.erroresValidacion = [];
    this.mostrarExito = false;

    this.calificacionForm.patchValue({
      puntuacion: 0,
      comentario: ''
    });
  }
}
