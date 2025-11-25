  // ...existing code...
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer, of } from 'rxjs';
import { retry, catchError, switchMap, timeout } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { NotificationService } from './notification.service';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
    // Métodos PATCH
    patch<T>(endpoint: string, data: any): Observable<T> {
      return this.makeRequest<T>('PATCH', endpoint, null, data);
    }
  private baseUrl = environment.apiUrl || 'http://localhost:3000/api';
  private isBackendAwaking = false;
  private readonly BACKEND_TIMEOUT = 30000; // 30 segundos
  private readonly MAX_RETRIES = 3;

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService
  ) {}

  // Métodos GET con manejo de backend dormido
  get<T>(endpoint: string, params?: any): Observable<T> {
    return this.makeRequest<T>('GET', endpoint, params);
  }

  // Método principal que maneja reintentos y reactivación del backend
  private makeRequest<T>(method: string, endpoint: string, params?: any, body?: any): Observable<T> {
    let httpParams = new HttpParams();

    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key]);
        }
      });
    }

    const options = {
      params: httpParams,
      headers: this.getHeaders(),
      body: body
    };

    const request$ = method === 'GET'
      ? this.http.get<T>(`${this.baseUrl}/${endpoint}`, options)
      : method === 'POST'
      ? this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, options)
      : method === 'PUT'
      ? this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, options)
      : this.http.delete<T>(`${this.baseUrl}/${endpoint}`, options);

    return request$.pipe(
      timeout(this.BACKEND_TIMEOUT),
      catchError((error: HttpErrorResponse) => {
        console.log('🔍 Error detectado:', error.status, error.message);

        // Si es error de CORS o el backend no responde
        if (error.status === 0 || error.status >= 500 || error.message.includes('CORS')) {
          console.log('⚡ Backend probablemente dormido, intentando reactivar...');

          return this.wakeUpBackend().pipe(
            switchMap(() => {
              console.log('🔄 Reintentando petición original...');
              // Reintentar la petición original
              return method === 'GET'
                ? this.http.get<T>(`${this.baseUrl}/${endpoint}`, options)
                : method === 'POST'
                ? this.http.post<T>(`${this.baseUrl}/${endpoint}`, body, options)
                : method === 'PUT'
                ? this.http.put<T>(`${this.baseUrl}/${endpoint}`, body, options)
                : this.http.delete<T>(`${this.baseUrl}/${endpoint}`, options);
            }),
            timeout(this.BACKEND_TIMEOUT),
            catchError((retryError) => {
              console.error('❌ Backend sigue sin responder después del intento de reactivación');
              return this.handleFallback<T>(endpoint, params, retryError);
            })
          );
        }

        // Para otros errores, devolver el error original
        return throwError(() => error);
      })
    );
  }

  // Manejo de fallback con datos mockeados
  private handleFallback<T>(endpoint: string, _params?: any, _error?: any): Observable<T> {
    console.log('📋 Usando datos de fallback para:', endpoint);
    this.notificationService.show({
      title: 'Sin conexión',
      message: 'Trabajando sin conexión 📱 Datos de demostración',
      type: 'warning'
    });

    // Fallbacks específicos por endpoint
    if (endpoint === 'productos') {
      return of(this.getMockProductos() as T);
    }

    if (endpoint.startsWith('productos/') && endpoint.split('/').length === 2) {
      const id = parseInt(endpoint.split('/')[1]);
      return of(this.getMockProductoById(id) as T);
    }

    // Pedidos endpoints
    if (endpoint === 'pedidos') {
      return of(this.getMockCrearPedidoResponse() as T);
    }

    if (endpoint.startsWith('pedidos/usuario/')) {
      return of(this.getMockPedidos() as T);
    }

    if (endpoint.startsWith('pedidos/') && endpoint.split('/').length === 2) {
      const id = parseInt(endpoint.split('/')[1]);
      return of(this.getMockPedidoById(id) as T);
    }

    // Chat endpoints
    if (endpoint === 'chats') {
      return of({ success: true, data: this.getMockChats() } as T);
    }

    if (endpoint === 'chat') {
      return of(this.getMockCrearChatResponse() as T);
    }

    if (endpoint.match(/^chat\/\d+\/mensajes$/)) {
      const chatId = parseInt(endpoint.split('/')[1]);
      return of(this.getMockMensajes(chatId) as T);
    }

    if (endpoint.match(/^chat\/\d+\/mensajes$/) && _params) {
      return of(this.getMockEnviarMensajeResponse() as T);
    }

    if (endpoint.match(/^chat\/\d+\/mensajes\/marcar-leidos$/)) {
      return of({ success: true, message: 'Mensajes marcados como leídos' } as T);
    }

    // Reputación endpoints
    if (endpoint === 'reputacion') {
      return of(this.getMockDarCalificacionResponse() as T);
    }

    if (endpoint.match(/^reputacion\/usuario\/\d+$/)) {
      const usuarioId = parseInt(endpoint.split('/')[2]);
      return of(this.getMockReputacionUsuario(usuarioId) as T);
    }

    if (endpoint === 'reputacion/mis-calificaciones') {
      return of({ calificaciones: this.getMockCalificaciones() } as T);
    }

    if (endpoint.match(/^reputacion\/puede-calificar\/\d+\/\d+$/)) {
      return of({ puede_calificar: true } as T);
    }

    if (endpoint === 'reputacion/pendientes') {
      return of({ pedidos_pendientes: this.getMockPedidosPendientesCalificar() } as T);
    }

    if (endpoint === 'auth/login' || endpoint === 'usuarios/login') {
      return of(this.getMockLoginResponse() as T);
    }

    // Para otros endpoints, devolver error
    return throwError(() => new Error(`No hay datos de fallback disponibles para: ${endpoint}`));
  }

  // Método request público para usar desde servicios
  request<T>(method: 'GET' | 'POST' | 'PUT' | 'DELETE', endpoint: string, body?: any): Observable<T> {
    return this.makeRequest<T>(method, endpoint, null, body);
  }

  // Métodos POST
  post<T>(endpoint: string, data: any): Observable<T> {
    return this.makeRequest<T>('POST', endpoint, null, data);
  }

  // Métodos PUT
  put<T>(endpoint: string, data: any): Observable<T> {
    return this.makeRequest<T>('PUT', endpoint, null, data);
  }

  // Métodos DELETE
  delete<T>(endpoint: string): Observable<T> {
    return this.makeRequest<T>('DELETE', endpoint);
  }

  // Upload de archivos
  uploadFile(endpoint: string, fileOrFormData: File | FormData): Observable<any> {
    let formData: FormData;

    if (fileOrFormData instanceof FormData) {
      formData = fileOrFormData;
    } else {
      formData = new FormData();
      formData.append('file', fileOrFormData);
    }

    return this.http.post(`${this.baseUrl}/${endpoint}`, formData, {
      headers: this.getFileHeaders()
    });
  }

  // Headers personalizados sin CORS headers problemáticos
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('efresco_token');
    const headers: any = {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  // Headers para archivos (sin Content-Type para que el navegador lo establezca automáticamente)
  private getFileHeaders(): HttpHeaders {
    const token = localStorage.getItem('efresco_token');
    const headers: any = {
      'Accept': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    return new HttpHeaders(headers);
  }

  /**
   * Intenta despertar el backend en Render.com
   */
  private wakeUpBackend(): Observable<any> {
    if (this.isBackendAwaking) {
      return timer(2000); // Esperar si ya está despertando
    }

    this.isBackendAwaking = true;
    this.notificationService.backendWaking();

    const healthCheck = this.http.get(`${this.baseUrl}/health`, {
      headers: this.getHeaders(),
      observe: 'response'
    }).pipe(
      timeout(this.BACKEND_TIMEOUT),
      retry(this.MAX_RETRIES),
      catchError((error: HttpErrorResponse) => {
        console.warn('Backend wake-up failed:', error.message);
        this.notificationService.backendOffline();
        this.isBackendAwaking = false;
        return throwError(() => error);
      })
    );

    return healthCheck.pipe(
      switchMap(() => {
        this.isBackendAwaking = false;
        this.notificationService.backendOnline();
        return of(true);
      })
    );
  }

  // Métodos específicos para productos con estructura de la API real
  getProductos(page: number = 1, limit: number = 10, filters?: any): Observable<any> {
    const params: any = { page, limit };

    if (filters) {
      if (filters.search) params.search = filters.search;
      if (filters.categoria_id) params.categoria_id = filters.categoria_id;
      if (filters.precio_min) params.precio_min = filters.precio_min;
      if (filters.precio_max) params.precio_max = filters.precio_max;
    }

    return this.get('productos', params);
  }

  getProductoById(id: number): Observable<any> {
    return this.get(`productos/${id}`);
  }

  createProducto(producto: any): Observable<any> {
    return this.post('productos', producto);
  }

  updateProducto(id: number, producto: any): Observable<any> {
    return this.put(`productos/${id}`, producto);
  }

  deleteProducto(id: number): Observable<any> {
    return this.delete(`productos/${id}`);
  }

  // Datos de fallback para cuando el backend no responde
  private getMockProductos(): any {
    return {
      productos: [
        {
          id: 1,
          nombre: "Papa blanca",
          descripcion: "Papa de calidad premium cultivada en tierras altas de Bolivia. Ideal para todo tipo de preparaciones culinarias.",
          unidad_medida: "kg",
          precio_referencial: 2.50,
          imagen_url: "https://images.unsplash.com/photo-1518977676601-b53f82aba655?w=400",
          categorias: [
            {
              id: 3,
              nombre: "Tubérculos"
            }
          ]
        },
        {
          id: 2,
          nombre: "Papa criolla",
          descripcion: "Papa pequeña de sabor intenso cultivada en los valles bolivianos",
          unidad_medida: "kg",
          precio_referencial: 3.00,
          imagen_url: "https://images.unsplash.com/photo-1594736797933-d0b22ba92655?w=400",
          categorias: [
            {
              id: 3,
              nombre: "Tubérculos"
            }
          ]
        },
        {
          id: 3,
          nombre: "Quinua Real",
          descripcion: "Quinua boliviana de la mejor calidad del altiplano",
          unidad_medida: "kg",
          precio_referencial: 35.00,
          imagen_url: "https://images.unsplash.com/photo-1594736797933-d0b22ba92655?w=400",
          categorias: [
            {
              id: 1,
              nombre: "Cereales"
            },
            {
              id: 7,
              nombre: "Granos"
            }
          ]
        },
        {
          id: 4,
          nombre: "Tomate Cherry",
          descripcion: "Tomates cherry frescos de invernadero",
          unidad_medida: "kg",
          precio_referencial: 15.50,
          imagen_url: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?w=400",
          categorias: [
            {
              id: 2,
              nombre: "Verduras"
            }
          ]
        },
        {
          id: 5,
          nombre: "Cebolla Roja",
          descripcion: "Cebollas rojas frescas de Cochabamba",
          unidad_medida: "kg",
          precio_referencial: 4.50,
          imagen_url: "https://images.unsplash.com/photo-1508747742699-2527895e8e2e?w=400",
          categorias: [
            {
              id: 2,
              nombre: "Verduras"
            }
          ]
        }
      ],
      paginacion: {
        total: 25,
        page: 1,
        limit: 10,
        pages: 3
      }
    };
  }

  private getMockProductoById(id: number): any {
    const productos = this.getMockProductos().productos;
    const producto = productos.find((p: any) => p.id === id);

    if (producto) {
      return {
        producto: producto
      };
    }

    // Si no se encuentra el producto, devolver el primero como ejemplo
    return {
      producto: productos[0]
    };
  }

  private getMockLoginResponse(): any {
    return {
      success: true,
      message: "Login exitoso (modo offline)",
      token: "mock_token_for_offline_demo",
      usuario: {
        id: 1,
        nombre: "Usuario Demo",
        email: "demo@efresco.com",
        tipoUsuario: "cliente",
        telefono: "70123456",
        direccion: "La Paz, Bolivia"
      }
    };
  }

  private getMockPedidos(): any {
    return {
      pedidos: [
        {
          id: 1,
          monto_total: 280.00,
          estado: "pendiente",
          fecha_pedido: "2025-11-23T12:00:00Z",
          tipo_anuncio: "venta",
          id_anuncio: 1,
          comprador: {
            id_usuario: 1,
            nombre: "Juan Carlos Pérez"
          },
          vendedor: {
            id_usuario: 2,
            nombre: "María González",
            telefono: "71234567"
          },
          anuncio: {
            id: 1,
            descripcion: "Papa blanca orgánica de las tierras altas de Bolivia, cultivada sin pesticidas...",
            producto: {
              nombre: "Papa blanca"
            }
          }
        },
        {
          id: 2,
          monto_total: 150.50,
          estado: "confirmado",
          fecha_pedido: "2025-11-22T14:30:00Z",
          tipo_anuncio: "venta",
          id_anuncio: 2,
          comprador: {
            id_usuario: 1,
            nombre: "Juan Carlos Pérez"
          },
          vendedor: {
            id_usuario: 3,
            nombre: "Carlos Mendoza",
            telefono: "72345678"
          },
          anuncio: {
            id: 2,
            descripcion: "Quinua real del altiplano boliviano, grano seleccionado...",
            producto: {
              nombre: "Quinua Real"
            }
          }
        },
        {
          id: 3,
          monto_total: 95.75,
          estado: "completado",
          fecha_pedido: "2025-11-21T09:15:00Z",
          tipo_anuncio: "venta",
          id_anuncio: 3,
          comprador: {
            id_usuario: 1,
            nombre: "Juan Carlos Pérez"
          },
          vendedor: {
            id_usuario: 4,
            nombre: "Ana Jiménez",
            telefono: "73456789"
          },
          anuncio: {
            id: 3,
            descripcion: "Tomates cherry orgánicos, frescos del invernadero...",
            producto: {
              nombre: "Tomate Cherry"
            }
          }
        }
      ],
      paginacion: {
        total: 3,
        page: 1,
        pages: 1
      }
    };
  }

  private getMockPedidoById(id: number): any {
    const pedidos = this.getMockPedidos().pedidos;
    const pedido = pedidos.find((p: any) => p.id === id);

    if (pedido) {
      return {
        pedido: pedido
      };
    }

    // Si no se encuentra el pedido, devolver el primero como ejemplo
    return {
      pedido: pedidos[0]
    };
  }

  private getMockCrearPedidoResponse(): any {
    return {
      mensaje: 'Pedido creado exitosamente',
      pedido: {
        id: Math.floor(Math.random() * 1000) + 1,
        id_comprador: 1,
        id_vendedor: 2,
        monto_total: 1550.00,
        estado: 'pendiente',
        fecha_pedido: new Date().toISOString(),
        tipo_anuncio: 'venta',
        id_anuncio: 1
      }
    };
  }

  // Mock data para Chat
  private getMockChats(): any[] {
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

  private getMockCrearChatResponse(): any {
    return {
      success: true,
      message: 'Chat creado exitosamente',
      data: {
        id_chat: Math.floor(Math.random() * 1000) + 3,
        id_usuario_1: 1,
        id_usuario_2: 2,
        tipo: 'privado',
        fecha_creacion: new Date().toISOString(),
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
        }
      }
    };
  }

  private getMockMensajes(chatId: number): any {
    if (chatId === 1) {
      return {
        success: true,
        data: {
          mensajes: [
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
          ],
          pagination: {
            total: 4,
            page: 1,
            pages: 1
          }
        }
      };
    }

    return {
      success: true,
      data: {
        mensajes: [],
        pagination: {
          total: 0,
          page: 1,
          pages: 1
        }
      }
    };
  }

  // Mock methods para Reputación
  private getMockDarCalificacionResponse(): any {
    return {
      mensaje: 'Calificación registrada exitosamente',
      reputacion: {
        id: Math.floor(Math.random() * 1000) + 1,
        id_usuario_calificador: 1,
        id_usuario_calificado: 2,
        puntuacion: 5,
        comentario: 'Excelente vendedora, producto de muy buena calidad y entrega puntual. Muy recomendada!',
        fecha_calificacion: new Date().toISOString(),
        id_pedido: 1,
        calificador: {
          nombre: 'Juan Carlos Pérez',
          imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
        }
      }
    };
  }

  private getMockReputacionUsuario(usuarioId: number): any {
    const usuarios = {
      1: {
        nombre: 'Juan Carlos Pérez',
        imagen_perfil: 'https://via.placeholder.com/60x60/22c55e/ffffff?text=JP'
      },
      2: {
        nombre: 'María González',
        imagen_perfil: 'https://via.placeholder.com/60x60/3b82f6/ffffff?text=MG'
      },
      3: {
        nombre: 'Carlos Mendoza',
        imagen_perfil: 'https://via.placeholder.com/60x60/f59e0b/ffffff?text=CM'
      }
    };

    const usuario = usuarios[usuarioId as keyof typeof usuarios] || usuarios[2];

    return {
      usuario: {
        id_usuario: usuarioId,
        nombre: usuario.nombre,
        imagen_perfil: usuario.imagen_perfil
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
          id_usuario_calificado: usuarioId,
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
          id_usuario_calificado: usuarioId,
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
          id_usuario_calificado: usuarioId,
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

  private getMockCalificaciones(): any[] {
    return [
      {
        id: 1,
        id_usuario_calificador: 2,
        id_usuario_calificado: 1,
        puntuacion: 5,
        comentario: 'Excelente comprador, muy puntual y responsable.',
        fecha_calificacion: '2025-11-23T10:00:00Z',
        id_pedido: 1,
        calificador: {
          nombre: 'María González'
        }
      },
      {
        id: 2,
        id_usuario_calificador: 3,
        id_usuario_calificado: 1,
        puntuacion: 4,
        comentario: 'Buena comunicación y transacción sin problemas.',
        fecha_calificacion: '2025-11-22T14:30:00Z',
        id_pedido: 2,
        calificador: {
          nombre: 'Carlos Mendoza'
        }
      }
    ];
  }

  private getMockPedidosPendientesCalificar(): any[] {
    return [
      {
        id_pedido: 1,
        usuario_calificar: {
          id_usuario: 2,
          nombre: 'María González',
          imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=MG'
        },
        producto: 'Tomates frescos',
        fecha_entrega: '2025-11-20T16:00:00Z'
      },
      {
        id_pedido: 3,
        usuario_calificar: {
          id_usuario: 4,
          nombre: 'Ana Silva',
          imagen_perfil: 'https://via.placeholder.com/40x40/f59e0b/ffffff?text=AS'
        },
        producto: 'Quinua Real',
        fecha_entrega: '2025-11-21T09:00:00Z'
      }
    ];
  }

  private getMockEnviarMensajeResponse(): any {
    return {
      success: true,
      message: 'Mensaje enviado exitosamente',
      data: {
        id_mensaje: Math.floor(Math.random() * 1000) + 10,
        id_chat: 1,
        id_usuario_remitente: 1,
        contenido: 'Mensaje de prueba enviado desde la aplicación',
        tipo_mensaje: 'texto',
        fecha_envio: new Date().toISOString(),
        leido: false,
        remitente: {
          id_usuario: 1,
          nombre: 'Juan Carlos Pérez',
          imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=JP'
        }
      }
    };
  }
}
