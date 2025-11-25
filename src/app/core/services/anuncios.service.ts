import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// Backend response for venta list
export interface AnunciosVentaListResponseBackend {
  anuncios: any[];
  paginacion?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

// Backend response for compra (single)
export interface AnuncioCompraResponse {
  mensaje: string;
  anuncio: AnuncioCompra;
}

// --- INTERFACES & TYPES ---
export interface AnuncioVentaRequest {
  id_producto: number;
  cantidad: number;
  unidad: string;
  precio: number;
  descripcion: string;
  ubicacion: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
}

export interface AnuncioCompraRequest {
  id_producto: number;
  cantidad: number;
  unidad: string;
  precio_ofertado: number;
  descripcion: string;
}

export interface Comprador {
  id: number;
  nombre: string;
  telefono: string;
}

export interface AnuncioCompra {
  id: number;
  producto?: {
    id: number;
    nombre: string;
    descripcion?: string;
    precio_referencial?: number;
    unidad_medida?: string;
    imagen_url?: string;
    imagen?: string;
  };
  cantidad: number;
  precio_ofertado: number;
  descripcion: string;
  comprador: Comprador;
  fecha_creacion?: string;
  unidad?: string;
  estado?: string;
}

export interface Vendedor {
  id: number;
  nombre: string;
  telefono: string;
}

export interface AnuncioVenta {
  id: number;
  producto: {
    id_producto: number;
    nombre: string;
    descripcion?: string;
    precio_referencial?: number;
    unidad_medida?: string;
    imagen_url?: string;
  };
  cantidad: number;
  unidad: string;
  precio: number;
  descripcion: string;
  ubicacion: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  vendedor: Vendedor;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  estado?: string;
}

export interface AnuncioVentaResponse {
  mensaje: string;
  anuncio: AnuncioVenta;
}

export interface AnunciosCompraListResponse {
  anuncios: AnuncioCompra[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface AnunciosQuery {
  page?: number;
  limit?: number;
  search?: string;
  producto_id?: number;
  ubicacion?: string;
  precio_min?: number;
  precio_max?: number;
  estado?: 'activo' | 'pausado' | 'vendido' | 'expirado';
}

export interface AnunciosCompraQuery {
  page?: number;
  limit?: number;
  search?: string;
  producto_id?: number;
  precio_min?: number;
  precio_max?: number;
  estado?: 'activo' | 'pausado' | 'completado' | 'expirado';
}

@Injectable({
  providedIn: 'root'
})
export class AnunciosService {
  constructor(private api: ApiService) {}

  // --- VENTA ---
  crearAnuncioVenta(anuncio: AnuncioVentaRequest): Observable<AnuncioVentaResponse> {
    return this.api.post<AnuncioVentaResponse>('anuncios/venta', anuncio);
  }

  getAnunciosVenta(query: AnunciosQuery = {}): Observable<AnunciosVentaListResponseBackend> {
    const params: any = {};
    if (query.page && query.page > 0) params.page = query.page.toString();
    if (query.limit && query.limit > 0) params.limit = query.limit.toString();
    if (query.search && query.search.trim()) params.search = query.search.trim();
    if (query.producto_id) params.producto_id = query.producto_id.toString();
    if (query.ubicacion && query.ubicacion.trim()) params.ubicacion = query.ubicacion.trim();
    if (query.precio_min !== undefined && query.precio_min >= 0) params.precio_min = query.precio_min.toString();
    if (query.precio_max !== undefined && query.precio_max >= 0) params.precio_max = query.precio_max.toString();
    if (query.estado) params.estado = query.estado;
    return this.api.get<AnunciosVentaListResponseBackend>('anuncios/venta', params);
  }

  getAnuncioVenta(id: number): Observable<{anuncio: AnuncioVenta}> {
    return this.api.get<{anuncio: AnuncioVenta}>(`anuncios/venta/${id}`);
  }

  actualizarAnuncioVenta(id: number, anuncio: Partial<AnuncioVentaRequest>): Observable<AnuncioVentaResponse> {
    return this.api.put<AnuncioVentaResponse>(`anuncios/venta/${id}`, anuncio);
  }

  eliminarAnuncioVenta(id: number): Observable<{mensaje: string}> {
    return this.api.delete<{mensaje: string}>(`anuncios/venta/${id}`);
  }

  cambiarEstadoAnuncio(id: number, estado: 'activo' | 'pausado' | 'vendido'): Observable<AnuncioVentaResponse> {
    return this.api.put<AnuncioVentaResponse>(`anuncios/venta/${id}/estado`, { estado });
  }

  buscarPorUbicacion(ubicacion: string, page: number = 1): Observable<AnunciosVentaListResponseBackend> {
    return this.getAnunciosVenta({ ubicacion, page, limit: 20 });
  }

  filtrarPorProducto(producto_id: number, page: number = 1): Observable<AnunciosVentaListResponseBackend> {
    return this.getAnunciosVenta({ producto_id, page, limit: 20 });
  }

  getMisAnuncios(page: number = 1): Observable<AnunciosVentaListResponseBackend> {
    return this.api.get<AnunciosVentaListResponseBackend>('anuncios/venta/mis-anuncios', {
      page: page.toString(),
      limit: '20'
    });
  }

  // --- GENERAL ---
  getMisAnunciosGeneral(tipo: 'venta' | 'compra', page: number = 1): Observable<any> {
    return this.api.get<any>('anuncios/mis-anuncios', {
      tipo,
      page: page.toString(),
      limit: '20'
    });
  }

  // --- COMPRA ---
  crearAnuncioCompra(anuncioData: AnuncioCompraRequest): Observable<AnuncioCompraResponse> {
    return this.api.post<AnuncioCompraResponse>('anuncios/compra', anuncioData);
  }

  getAnunciosCompra(query: AnunciosCompraQuery = {}): Observable<AnunciosCompraListResponse> {
    const params: any = {};
    if (query.page && query.page > 0) params.page = query.page.toString();
    if (query.limit && query.limit > 0) params.limit = query.limit.toString();
    if (query.search && query.search.trim()) params.search = query.search.trim();
    if (query.producto_id) params.producto_id = query.producto_id.toString();
    if (query.precio_min !== undefined && query.precio_min >= 0) params.precio_min = query.precio_min.toString();
    if (query.precio_max !== undefined && query.precio_max >= 0) params.precio_max = query.precio_max.toString();
    if (query.estado) params.estado = query.estado;
    return this.api.get<AnunciosCompraListResponse>('anuncios/compra', params);
  }

  getAnuncioCompra(id: number): Observable<AnuncioCompraResponse> {
    return this.api.get<AnuncioCompraResponse>(`anuncios/compra/${id}`);
  }

  actualizarAnuncioCompra(id: number, anuncioData: Partial<AnuncioCompraRequest>): Observable<AnuncioCompraResponse> {
    return this.api.put<AnuncioCompraResponse>(`anuncios/compra/${id}`, anuncioData);
  }

  eliminarAnuncioCompra(id: number): Observable<{mensaje: string}> {
    return this.api.delete<{mensaje: string}>(`anuncios/compra/${id}`);
  }

  getMisAnunciosCompra(page: number = 1): Observable<AnunciosCompraListResponse> {
    return this.api.get<AnunciosCompraListResponse>('anuncios/compra/mis-anuncios', {
      page: page.toString(),
      limit: '20'
    });
  }

  contactarComprador(anuncio: AnuncioCompra): void {
    if (anuncio.comprador?.telefono) {
      window.open(`tel:${anuncio.comprador.telefono}`, '_blank');
    }
  }

  contactarCompradorWhatsApp(anuncio: AnuncioCompra): void {
    const mensaje = `¡Hola! Vi tu anuncio de compra para *${anuncio.producto?.nombre || ''}*. Me interesa ofrecerte este producto.\n\n` +
      `Cantidad solicitada: ${anuncio.cantidad} ${anuncio.unidad || anuncio.producto?.unidad_medida || ''}\n` +
      `Precio ofertado: $${anuncio.precio_ofertado} ${anuncio.producto?.unidad_medida || 'unidad'}\n\n` +
      `¿Te gustaría que conversemos los detalles?`;
    if (anuncio.comprador?.telefono) {
      const telefono = anuncio.comprador.telefono.replace(/[^\d]/g, '');
      const whatsappUrl = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(whatsappUrl, '_blank');
    }
  }

  buscarComprasPorProducto(producto_id: number, page: number = 1): Observable<AnunciosCompraListResponse> {
    return this.getAnunciosCompra({ producto_id, page, limit: 20 });
  }

  filtrarComprasPorPrecio(precio_min?: number, precio_max?: number, page: number = 1): Observable<AnunciosCompraListResponse> {
    return this.getAnunciosCompra({ precio_min, precio_max, page, limit: 20 });
  }
}
