import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface Categoria {
  id: number;
  nombre: string;
}

export interface Producto {
  id_producto: number;
  id?: number; // compatibilidad si algún endpoint usa 'id'
  nombre: string;
  descripcion: string;
  precio_referencial: number | string;
  unidad_medida: string;
  imagen_url?: string;
  categorias?: Categoria[];
  // ...otros campos opcionales
}

export interface Paginacion {
  total: number;
  page: number;
  limit: number;
  pages: number;
}

export interface ProductosResponse {
  productos: Producto[];
  paginacion: Paginacion;
}

export interface ProductoDetalleResponse {
  producto: Producto;
}

export interface ProductosQuery {
  page?: number;
  limit?: number;
  search?: string;
  precio_min?: number;
  precio_max?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ProductosService {

  constructor(private api: ApiService) {}

  /**
   * Obtiene la lista de productos con filtros opcionales
   * GET /api/productos
   */
  getProductos(query: ProductosQuery = {}): Observable<ProductosResponse> {
    const params: any = {};

    // Solo incluir parámetros que tienen valor
    if (query.page && query.page > 0) params.page = query.page.toString();
    if (query.limit && query.limit > 0) params.limit = query.limit.toString();
    if (query.search && query.search.trim()) params.search = query.search.trim();
    if (query.precio_min !== undefined && query.precio_min >= 0) params.precio_min = query.precio_min.toString();
    if (query.precio_max !== undefined && query.precio_max >= 0) params.precio_max = query.precio_max.toString();

    return this.api.get<ProductosResponse>('productos', params);
  }

  /**
   * Buscar productos por nombre
   */
  buscarProductos(search: string, page: number = 1, limit: number = 20): Observable<ProductosResponse> {
    return this.getProductos({
      search,
      page,
      limit
    });
  }

  /**
   * Filtrar productos por rango de precio
   */
  filtrarPorPrecio(precio_min: number, precio_max: number, page: number = 1): Observable<ProductosResponse> {
    return this.getProductos({
      precio_min,
      precio_max,
      page,
      limit: 20
    });
  }

  /**
   * Obtener productos para el catálogo principal
   */
  getCatalogo(page: number = 1): Observable<ProductosResponse> {
    return this.getProductos({
      page,
      limit: 12 // 12 productos por página para grid responsive
    });
  }

  /**
   * Obtener un producto específico por ID
   * GET /api/productos/:id
   */
  getProducto(id: number): Observable<ProductoDetalleResponse> {
    return this.api.get<ProductoDetalleResponse>(`productos/${id}`);
  }

  /**
   * Subir imagen de producto
   * POST /api/productos/{id}/imagen
   * Headers: Authorization: Bearer {token}
   * Content-Type: multipart/form-data
   * Body: imagen=[archivo]  ← Campo "imagen" para productos (español)
   */
  uploadProductImage(productId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('imagen', file);  // ← Campo 'imagen' para productos
    return this.api.uploadFile(`productos/${productId}/imagen`, formData);
  }

  /**
   * Eliminar imagen de producto
   * DELETE /api/productos/{id}/imagen
   * Headers: Authorization: Bearer {token}
   */
  deleteProductImage(productId: number): Observable<any> {
    return this.api.delete<any>(`productos/${productId}/imagen`);
  }

  /**
   * Crear un nuevo producto
   * POST /api/productos
   */
  createProduct(productData: Partial<Producto>): Observable<any> {
    return this.api.post<any>('productos', productData);
  }

  /**
   * Actualizar un producto existente
   * PUT /api/productos/{id}
   */
  updateProduct(productId: number, productData: Partial<Producto>): Observable<any> {
    return this.api.put<any>(`productos/${productId}`, productData);
  }

  /**
   * Eliminar un producto
   * DELETE /api/productos/{id}
   */
  deleteProduct(productId: number): Observable<any> {
    return this.api.delete<any>(`productos/${productId}`);
  }
}
