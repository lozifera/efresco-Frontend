
import { Injectable } from '@angular/core';
import { Observable, map } from 'rxjs';
import { ApiService } from './api.service';


// Interfaces para la respuesta del backend
export interface PedidoBackend {
  id_pedido: number;
  id_comprador: number;
  id_vendedor: number;
  id_anuncio: number;
  tipo_anuncio: string;
  monto_total: string;
  estado: string;
  fecha: string;
  verificado_manualmente: boolean;
  notas_verificacion: string | null;
  Comprador: {
    id_usuario: number;
    nombre: string;
    telefono: string;
  };
  Vendedor: {
    id_usuario: number;
    nombre: string;
    telefono: string;
  };
}

export interface PedidosResponseBackend {
  success: boolean;
  data: PedidoBackend[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

// Modelo interno (opcional, puedes usar PedidoBackend directamente si prefieres)
export interface Pedido {
  id: number;
  monto_total: string;
  estado: string;
  fecha: string;
  comprador: {
    id_usuario: number;
    nombre: string;
    telefono: string;
  };
  vendedor: {
    id_usuario: number;
    nombre: string;
    telefono: string;
  };
  tipo_anuncio: string;
  id_anuncio: number;
  verificado_manualmente: boolean;
  notas_verificacion: string | null;
}

export interface CrearPedidoRequest {
  id_comprador: number;
  id_vendedor: number;
  monto_total: number;
  tipo_anuncio: 'venta' | 'compra';
  id_anuncio: number;
}

export interface CrearPedidoResponse {
  mensaje: string;
  pedido: Pedido;
}

export interface PedidosResponse {
  pedidos: Pedido[];
  paginacion: {
    total: number;
    page: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class PedidosService {
    /**
     * Marca un pedido como verificado/cumplido manualmente
     * @param id ID del pedido
     * @param verificado_manualmente true/false
     * @param notas_verificacion nota opcional
     */
    verificarPedido(id: number, verificado_manualmente: boolean, notas_verificacion: string = ''): Observable<any> {
      return this.apiService.patch<any>(`pedidos/${id}/verificar`, {
        verificado_manualmente,
        notas_verificacion
      });
    }
  constructor(private apiService: ApiService) {}

  simularPago(pedidoId: number): Observable<any> {
    return this.apiService.post<any>(`pedidos/${pedidoId}/simular-pago`, {});
  }

  crearPedido(pedidoData: CrearPedidoRequest): Observable<CrearPedidoResponse> {
    return this.apiService.post<CrearPedidoResponse>('pedidos', pedidoData);
  }

  // Nuevo método para consumir la respuesta del backend
  getMisPedidos(tipo: string = 'todos', page: number = 1, limit: number = 10): Observable<{ pedidos: Pedido[], paginacion: PedidosResponseBackend['pagination'] }> {
    const params = {
      tipo,
      page: page.toString(),
      limit: limit.toString()
    };
    const userId = this.getUserId();
    return this.apiService.get<PedidosResponseBackend>(`pedidos/usuario/${userId}`, params).pipe(
      map(response => ({
        pedidos: response.data.map(p => ({
          id: p.id_pedido,
          monto_total: p.monto_total,
          estado: p.estado,
          fecha: p.fecha,
          comprador: p.Comprador,
          vendedor: p.Vendedor,
          tipo_anuncio: p.tipo_anuncio,
          id_anuncio: p.id_anuncio,
          verificado_manualmente: p.verificado_manualmente,
          notas_verificacion: p.notas_verificacion
        })),
        paginacion: response.pagination
      }))
    );
  }

  getPedidoById(id: number): Observable<{ pedido: Pedido }> {
    return this.apiService.get<{ pedido: Pedido }>(`pedidos/${id}`);
  }

  actualizarEstadoPedido(id: number, estado: string): Observable<any> {
    return this.apiService.put(`pedidos/${id}/estado`, { estado });
  }

  cancelarPedido(id: number): Observable<any> {
    return this.apiService.put(`pedidos/${id}/cancelar`, {});
  }

  getEstadisticasPedidos(): Observable<any> {
    return this.apiService.get('pedidos/estadisticas');
  }

  private getUserId(): number {
    const userData = localStorage.getItem('efresco_user');
    if (userData) {
      return JSON.parse(userData).id || 1;
    }
    return 1;
  }

  formatearFecha(fecha: string): string {
    return new Date(fecha).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    } as Intl.DateTimeFormatOptions);
  }

  getColorEstado(estado: string): string {
    const colores = {
      'pendiente': 'bg-yellow-100 text-yellow-800',
      'confirmado': 'bg-blue-100 text-blue-800',
      'en_proceso': 'bg-purple-100 text-purple-800',
      'completado': 'bg-green-100 text-green-800',
      'cancelado': 'bg-red-100 text-red-800',
    };
    return colores[estado as keyof typeof colores] || 'bg-gray-100 text-gray-800';
  }

  getDescripcionEstado(estado: string): string {
    const descripciones = {
      'pendiente': 'Esperando confirmación del vendedor',
      'confirmado': 'Confirmado por el vendedor',
      'en_proceso': 'En proceso de preparación',
      'completado': 'Pedido entregado',
      'cancelado': 'Pedido cancelado',
    };
    return descripciones[estado as keyof typeof descripciones] || estado;
  }
}
