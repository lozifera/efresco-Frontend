import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

// Interfaces para Reputación
export interface DarCalificacionRequest {
  id_usuario_calificado: number;
  puntuacion: number;
  comentario: string;
  id_pedido: number;
}

export interface Calificacion {
  id: number;
  id_usuario_calificador?: number;
  id_usuario_calificado: number;
  puntuacion: number;
  comentario: string;
  fecha_calificacion: string;
  id_pedido: number;
  calificador?: {
    nombre: string;
    imagen_perfil?: string;
  };
}

export interface DarCalificacionResponse {
  mensaje: string;
  reputacion: Calificacion;
}

export interface DistribucionEstrellas {
  '5_estrellas': number;
  '4_estrellas': number;
  '3_estrellas': number;
  '2_estrellas': number;
  '1_estrella': number;
}

export interface EstadisticasReputacion {
  promedio_puntuacion: number;
  total_calificaciones: number;
  distribucion: DistribucionEstrellas;
}

export interface ReputacionUsuario {
  usuario: {
    id_usuario: number;
    nombre: string;
    imagen_perfil?: string;
  };
  estadisticas: EstadisticasReputacion;
  calificaciones_recientes: Calificacion[];
}

@Injectable({
  providedIn: 'root'
})
export class ReputacionService {
  private readonly API_URL = 'https://efresco-backend.onrender.com/api';
  private reputacionesSubject = new BehaviorSubject<Calificacion[]>([]);

  public reputaciones$ = this.reputacionesSubject.asObservable();

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Dar una calificación a un usuario
   */
  darCalificacion(request: DarCalificacionRequest): Observable<DarCalificacionResponse> {
    return this.apiService.request<DarCalificacionResponse>('POST', '/reputacion', request).pipe(
      tap(response => {
        if (response.reputacion) {
          const calificacionesActuales = this.reputacionesSubject.value;
          this.reputacionesSubject.next([response.reputacion, ...calificacionesActuales]);
        }
      })
    );
  }

  /**
   * Obtener reputación de un usuario específico
   */
  getReputacionUsuario(usuarioId: number): Observable<ReputacionUsuario> {
    return this.apiService.request<ReputacionUsuario>('GET', `/reputacion/usuario/${usuarioId}`);
  }

  /**
   * Validar una calificación antes de enviarla
   */
  validarCalificacion(request: DarCalificacionRequest): { valido: boolean; errores: string[] } {
    const errores: string[] = [];

    if (!request.puntuacion || request.puntuacion < 1 || request.puntuacion > 5) {
      errores.push('La puntuación debe ser entre 1 y 5 estrellas');
    }

    if (!request.comentario || request.comentario.trim().length < 10) {
      errores.push('El comentario debe tener al menos 10 caracteres');
    }

    if (request.comentario && request.comentario.length > 500) {
      errores.push('El comentario no puede exceder 500 caracteres');
    }

    if (!request.id_usuario_calificado || request.id_usuario_calificado <= 0) {
      errores.push('ID de usuario calificado inválido');
    }

    if (!request.id_pedido || request.id_pedido <= 0) {
      errores.push('ID de pedido inválido');
    }

    return {
      valido: errores.length === 0,
      errores
    };
  }

  /**
   * Formatear puntuación como estrellas
   */
  formatearEstrellas(puntuacion: number): string {
    return '★'.repeat(puntuacion) + '☆'.repeat(5 - puntuacion);
  }

  /**
   * Obtener color segun puntuacion
   */
  getColorPuntuacion(puntuacion: number): string {
    if (puntuacion >= 4.5) return 'text-green-600';
    if (puntuacion >= 3.5) return 'text-yellow-600';
    if (puntuacion >= 2.5) return 'text-orange-600';
    return 'text-red-600';
  }

  /**
   * Obtener texto descriptivo según puntuación
   */
  getTextoReputacion(promedio: number): string {
    if (promedio >= 4.8) return 'Excelente';
    if (promedio >= 4.5) return 'Muy bueno';
    if (promedio >= 4.0) return 'Bueno';
    if (promedio >= 3.5) return 'Regular';
    if (promedio >= 3.0) return 'Aceptable';
    return 'Mejorable';
  }

  /**
   * Formatear fecha de calificación
   */
  formatearFechaCalificacion(fecha: string): string {
    const fechaCalif = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaCalif.getTime();
    const diffDias = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDias === 0) {
      return 'Hoy';
    } else if (diffDias === 1) {
      return 'Ayer';
    } else if (diffDias < 7) {
      return `Hace ${diffDias} días`;
    } else if (diffDias < 30) {
      const semanas = Math.floor(diffDias / 7);
      return `Hace ${semanas} semana${semanas > 1 ? 's' : ''}`;
    } else {
      return fechaCalif.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  }

  /**
   * Calcular porcentaje para distribución de estrellas
   */
  calcularPorcentajeDistribucion(cantidad: number, total: number): number {
    return total > 0 ? Math.round((cantidad / total) * 100) : 0;
  }
}
