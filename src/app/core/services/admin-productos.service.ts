import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Producto {
  id?: number;
  nombre: string;
  descripcion: string;
  precio: number;
  unidad: string;
  disponible: boolean;
  cantidad_disponible: number;
  vendedor_id: number;
  categoria_id: number;
  imagen_url?: string;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
}

export interface CrearProductoData {
  nombre: string;
  descripcion: string;
  precio: number;
  unidad: string;
  disponible: boolean;
  cantidad_disponible: number;
  vendedor_id: number;
  categoria_id: number;
}

export interface ActualizarProductoData {
  nombre?: string;
  descripcion?: string;
  precio?: number;
  unidad?: string;
  disponible?: boolean;
  cantidad_disponible?: number;
  vendedor_id?: number;
  categoria_id?: number;
}

export interface ProductosResponse {
  productos: Producto[];
  paginacion?: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Vendedor {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminProductosService {
  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  /**
   * Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('efresco_token');
    console.log('[AdminProductosService] Configurando headers de autenticación');
    console.log('[Token] Presente:', !!token);

    return new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });
  }

  /**
   * LISTAR PRODUCTOS (público)
   * GET /api/productos
   */
  listarProductos(page: number = 1, limit: number = 10): Observable<ProductosResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductosResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * LISTAR TODOS LOS PRODUCTOS PARA ADMIN
   * GET /api/productos (con headers de autenticación admin)
   */
  listarProductosAdmin(page: number = 1, limit: number = 10): Observable<ProductosResponse> {
    const headers = this.getAuthHeaders();
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    console.log('[AdminProductosService] Listando productos como admin');
    // Usar el mismo endpoint pero con headers de autenticación para obtener vista completa
    return this.http.get<ProductosResponse>(`${this.apiUrl}`, { headers, params });
  }

  /**
   * OBTENER PRODUCTO ESPECÍFICO (público)
   * GET /api/productos/:id
   */
  obtenerProducto(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  /**
   * CREAR PRODUCTO (admin)
   * POST /api/productos
   */
  crearProducto(data: CrearProductoData): Observable<{ mensaje: string; producto: Producto }> {
    const headers = this.getAuthHeaders();
    console.log('[AdminProductosService] Creando producto:', data);

    return this.http.post<{ mensaje: string; producto: Producto }>(`${this.apiUrl}`, data, { headers });
  }

  /**
   * ACTUALIZAR PRODUCTO (admin)
   * PUT /api/productos/:id
   */
  actualizarProducto(id: number, data: ActualizarProductoData): Observable<{ mensaje: string; producto: Producto }> {
    const headers = this.getAuthHeaders();
    console.log('[AdminProductosService] Actualizando producto:', id, data);

    return this.http.put<{ mensaje: string; producto: Producto }>(`${this.apiUrl}/${id}`, data, { headers });
  }

  /**
   * ELIMINAR PRODUCTO (admin)
   * DELETE /api/productos/:id
   */
  eliminarProducto(id: number): Observable<{ mensaje: string }> {
    const headers = this.getAuthHeaders();
    console.log('[AdminProductosService] Eliminando producto:', id);

    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}`, { headers });
  }

  /**
   * SUBIR IMAGEN DE PRODUCTO (admin)
   * POST /api/productos/:id/imagen
   */
  subirImagenProducto(id: number, imagen: File): Observable<{ mensaje: string; imagen_url: string }> {
    const token = localStorage.getItem('efresco_token');
    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
      // No agregar Content-Type para FormData
    });

    const formData = new FormData();
    formData.append('imagen', imagen);

    console.log('[AdminProductosService] Subiendo imagen para producto:', id);

    return this.http.post<{ mensaje: string; imagen_url: string }>(`${this.apiUrl}/${id}/imagen`, formData, { headers });
  }

  /**
   * ELIMINAR IMAGEN DE PRODUCTO (admin)
   * DELETE /api/productos/:id/imagen
   */
  eliminarImagenProducto(id: number): Observable<{ mensaje: string }> {
    const headers = this.getAuthHeaders();
    console.log('[AdminProductosService] Eliminando imagen de producto:', id);

    return this.http.delete<{ mensaje: string }>(`${this.apiUrl}/${id}/imagen`, { headers });
  }

  /**
   * MÉTODOS DE CONVENIENCIA
   */

  /**
   * Buscar productos por nombre
   */
  buscarProductos(query: string, page: number = 1, limit: number = 10): Observable<ProductosResponse> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductosResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * Obtener productos por categoría
   */
  obtenerProductosPorCategoria(categoriaId: number, page: number = 1, limit: number = 10): Observable<ProductosResponse> {
    const params = new HttpParams()
      .set('categoria_id', categoriaId.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductosResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * Obtener productos por vendedor
   */
  obtenerProductosPorVendedor(vendedorId: number, page: number = 1, limit: number = 10): Observable<ProductosResponse> {
    const params = new HttpParams()
      .set('vendedor_id', vendedorId.toString())
      .set('page', page.toString())
      .set('limit', limit.toString());

    return this.http.get<ProductosResponse>(`${this.apiUrl}`, { params });
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE PRODUCTOS
   */
  obtenerEstadisticas(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/admin/stats`, { headers });
  }

  /**
   * 📈 OBTENER ESTADÍSTICAS DEL DASHBOARD
   */
  obtenerEstadisticasDashboard(): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.get(`${this.apiUrl}/admin/dashboard-stats`, { headers });
  }
}
