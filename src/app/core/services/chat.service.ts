import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, interval } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ApiService } from './api.service';

// Interfaces para Chat
export interface Usuario {
  id_usuario: number;
  nombre: string;
  imagen_perfil: string;
}

export interface Chat {
  id_chat: number;
  id_usuario_1: number;
  id_usuario_2: number;
  tipo: 'privado';
  fecha_creacion: string;
  activo: boolean;
  usuario1: Usuario;
  usuario2: Usuario;
  ultimo_mensaje?: Mensaje;
}

export interface Mensaje {
  id_mensaje: number;
  id_chat: number;
  id_usuario_remitente: number;
  contenido: string;
  tipo_mensaje: 'texto' | 'imagen' | 'archivo';
  fecha_envio: string;
  leido: boolean;
  remitente: Usuario;
}

export interface CrearChatRequest {
  id_usuario_destinatario: number;
}

export interface CrearChatResponse {
  success: boolean;
  message: string;
  data: Chat;
}

export interface EnviarMensajeRequest {
  contenido: string;
  tipo_mensaje: 'texto' | 'imagen' | 'archivo';
}

export interface EnviarMensajeResponse {
  success: boolean;
  message: string;
  data: Mensaje;
}

export interface MensajesResponse {
  success: boolean;
  data: {
    mensajes: Mensaje[];
    pagination: {
      total: number;
      page: number;
      pages: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class ChatService {
  private readonly API_URL = 'https://efresco-backend.onrender.com/api';
  private chatsSubject = new BehaviorSubject<Chat[]>([]);
  private mensajesSubject = new BehaviorSubject<Mensaje[]>([]);
  private chatActivoSubject = new BehaviorSubject<Chat | null>(null);

  // Observables públicos
  public chats$ = this.chatsSubject.asObservable();
  public mensajes$ = this.mensajesSubject.asObservable();
  public chatActivo$ = this.chatActivoSubject.asObservable();

  // Polling para mensajes en tiempo real
  private pollingInterval = 5000; // 5 segundos
  private isPolling = false;

  constructor(
    private http: HttpClient,
    private apiService: ApiService
  ) {}

  /**
   * Crear un nuevo chat entre dos usuarios
   */
  crearChat(request: CrearChatRequest): Observable<CrearChatResponse> {
    return this.apiService.request<CrearChatResponse>('POST', 'chat', request).pipe(
      tap(response => {
        if (response.success) {
          // Agregar el nuevo chat a la lista
          const chatsActuales = this.chatsSubject.value;
          this.chatsSubject.next([response.data, ...chatsActuales]);
        }
      })
    );
  }

  /**
   * Obtener lista de chats del usuario actual
   */
  getMisChats(): Observable<Chat[]> {
    return this.apiService.request<{ success: boolean; data: Chat[] }>('GET', 'chats').pipe(
      map(response => {
        if (response.success) {
          this.chatsSubject.next(response.data);
          return response.data;
        }
        return [];
      })
    );
  }

  /**
   * Enviar mensaje en un chat
   */
  enviarMensaje(chatId: number, request: EnviarMensajeRequest): Observable<EnviarMensajeResponse> {
    return this.apiService.request<EnviarMensajeResponse>('POST', `chat/${chatId}/mensajes`, request).pipe(
      tap(response => {
        if (response.success) {
          // Agregar el nuevo mensaje a la lista
          const mensajesActuales = this.mensajesSubject.value;
          this.mensajesSubject.next([...mensajesActuales, response.data]);

          // Actualizar el último mensaje en el chat
          this.actualizarUltimoMensajeEnChat(chatId, response.data);
        }
      })
    );
  }

  /**
   * Obtener mensajes de un chat específico
   */
  getMensajes(chatId: number, page: number = 1): Observable<MensajesResponse> {
    return this.apiService.request<MensajesResponse>('GET', `chat/${chatId}/mensajes?page=${page}`).pipe(
      tap(response => {
        if (response.success) {
          if (page === 1) {
            // Primera página, reemplazar mensajes
            this.mensajesSubject.next(response.data.mensajes);
          } else {
            // Páginas siguientes, agregar mensajes
            const mensajesActuales = this.mensajesSubject.value;
            this.mensajesSubject.next([...response.data.mensajes, ...mensajesActuales]);
          }
        }
      })
    );
  }

  /**
   * Marcar mensajes como leídos
   */
  marcarMensajesComoLeidos(chatId: number): Observable<any> {
    return this.apiService.request<any>('PUT', `chat/${chatId}/mensajes/marcar-leidos`, {}).pipe(
      tap(() => {
        // Actualizar mensajes locales como leídos
        const mensajesActuales = this.mensajesSubject.value;
        const mensajesActualizados = mensajesActuales.map(mensaje => ({
          ...mensaje,
          leido: true
        }));
        this.mensajesSubject.next(mensajesActualizados);
      })
    );
  }

  /**
   * Establecer chat activo y comenzar polling de mensajes
   */
  establecerChatActivo(chat: Chat): void {
    this.chatActivoSubject.next(chat);
    this.iniciarPollingMensajes(chat.id_chat);
  }

  /**
   * Cerrar chat activo y detener polling
   */
  cerrarChatActivo(): void {
    this.chatActivoSubject.next(null);
    this.detenerPollingMensajes();
    this.mensajesSubject.next([]);
  }

  /**
   * Iniciar polling de mensajes para tiempo real
   */
  private iniciarPollingMensajes(chatId: number): void {
    if (this.isPolling) {
      this.detenerPollingMensajes();
    }

    this.isPolling = true;

    // Polling cada X segundos
    interval(this.pollingInterval).pipe(
      switchMap(() => this.getMensajes(chatId, 1))
    ).subscribe({
      next: () => {
        // Los mensajes se actualizan automáticamente en getMensajes
      },
      error: (error) => {
        console.error('Error en polling de mensajes:', error);
      }
    });
  }

  /**
   * Detener polling de mensajes
   */
  private detenerPollingMensajes(): void {
    this.isPolling = false;
  }

  /**
   * Actualizar último mensaje en la lista de chats
   */
  private actualizarUltimoMensajeEnChat(chatId: number, mensaje: Mensaje): void {
    const chatsActuales = this.chatsSubject.value;
    const chatsActualizados = chatsActuales.map(chat => {
      if (chat.id_chat === chatId) {
        return {
          ...chat,
          ultimo_mensaje: mensaje
        };
      }
      return chat;
    });
    this.chatsSubject.next(chatsActualizados);
  }

  /**
   * Buscar chat existente entre dos usuarios
   */
  buscarChatConUsuario(usuarioId: number): Observable<Chat | null> {
    return this.chats$.pipe(
      map(chats => {
        return chats.find(chat =>
          chat.id_usuario_1 === usuarioId || chat.id_usuario_2 === usuarioId
        ) || null;
      })
    );
  }

  /**
   * Obtener usuario del chat que no es el actual
   */
  getOtroUsuarioDelChat(chat: Chat, usuarioActualId: number): Usuario {
    return chat.id_usuario_1 === usuarioActualId ? chat.usuario2 : chat.usuario1;
  }

  /**
   * Verificar si un mensaje es del usuario actual
   */
  esMensajePropio(mensaje: Mensaje, usuarioActualId: number): boolean {
    return mensaje.id_usuario_remitente === usuarioActualId;
  }

  /**
   * Formatear fecha de mensaje
   */
  formatearFechaMensaje(fecha: string): string {
    const fechaMensaje = new Date(fecha);
    const ahora = new Date();
    const diffMs = ahora.getTime() - fechaMensaje.getTime();
    const diffMinutos = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMinutos / 60);
    const diffDias = Math.floor(diffHoras / 24);

    if (diffMinutos < 1) {
      return 'Ahora';
    } else if (diffMinutos < 60) {
      return `${diffMinutos}m`;
    } else if (diffHoras < 24) {
      return `${diffHoras}h`;
    } else if (diffDias < 7) {
      return `${diffDias}d`;
    } else {
      return fechaMensaje.toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'short'
      });
    }
  }

  /**
   * Obtener datos mock para desarrollo
   */
  private getMockChats(): Chat[] {
    return [
      {
        id_chat: 1,
        id_usuario_1: 1,
        id_usuario_2: 2,
        tipo: 'privado',
        fecha_creacion: '2025-11-23T14:00:00Z',
        activo: true,
        usuario1: {
          id_usuario: 1,
          nombre: 'Juan Carlos Pérez',
          imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
        },
        usuario2: {
          id_usuario: 2,
          nombre: 'María González',
          imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
        },
        ultimo_mensaje: {
          id_mensaje: 2,
          id_chat: 1,
          id_usuario_remitente: 2,
          contenido: '¡Hola Juan! Claro, la papa es orgánica y muy fresca.',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T14:10:00Z',
          leido: false,
          remitente: {
            id_usuario: 2,
            nombre: 'María González',
            imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
          }
        }
      },
      {
        id_chat: 2,
        id_usuario_1: 1,
        id_usuario_2: 3,
        tipo: 'privado',
        fecha_creacion: '2025-11-23T15:30:00Z',
        activo: true,
        usuario1: {
          id_usuario: 1,
          nombre: 'Juan Carlos Pérez',
          imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
        },
        usuario2: {
          id_usuario: 3,
          nombre: 'Carlos Mendoza',
          imagen_perfil: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=CM'
        },
        ultimo_mensaje: {
          id_mensaje: 5,
          id_chat: 2,
          id_usuario_remitente: 1,
          contenido: 'Perfecto, nos vemos mañana a las 9 AM',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T16:45:00Z',
          leido: true,
          remitente: {
            id_usuario: 1,
            nombre: 'Juan Carlos Pérez',
            imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
          }
        }
      }
    ];
  }

  private getMockMensajes(chatId: number): Mensaje[] {
    if (chatId === 1) {
      return [
        {
          id_mensaje: 1,
          id_chat: 1,
          id_usuario_remitente: 1,
          contenido: 'Hola María! Me interesa tu anuncio de papa blanca. ¿Podrías darme más detalles?',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T14:05:00Z',
          leido: true,
          remitente: {
            id_usuario: 1,
            nombre: 'Juan Carlos Pérez',
            imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
          }
        },
        {
          id_mensaje: 2,
          id_chat: 1,
          id_usuario_remitente: 2,
          contenido: '¡Hola Juan! Claro, la papa es orgánica y muy fresca. Tengo 500 kg disponibles.',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T14:10:00Z',
          leido: true,
          remitente: {
            id_usuario: 2,
            nombre: 'María González',
            imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
          }
        },
        {
          id_mensaje: 3,
          id_chat: 1,
          id_usuario_remitente: 1,
          contenido: 'Excelente! ¿Cuál es el precio por kg? Y ¿desde cuándo está disponible?',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T14:15:00Z',
          leido: true,
          remitente: {
            id_usuario: 1,
            nombre: 'Juan Carlos Pérez',
            imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
          }
        },
        {
          id_mensaje: 4,
          id_chat: 1,
          id_usuario_remitente: 2,
          contenido: 'El precio es Bs. 15.50 por kg. Está disponible desde hoy. ¿Te interesa hacer un pedido?',
          tipo_mensaje: 'texto',
          fecha_envio: '2025-11-23T14:20:00Z',
          leido: false,
          remitente: {
            id_usuario: 2,
            nombre: 'María González',
            imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
          }
        }
      ];
    }
    return [];
  }
}
