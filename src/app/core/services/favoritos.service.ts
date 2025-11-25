import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

// Interfaces para favoritos
export interface FavoritoRequest {
  id_producto?: number;
  id_anuncio_venta?: number;
}

export interface FavoritoResponse {
  mensaje: string;
}

export interface ProductoFavorito {
  id: number;
  nombre: string;
  descripcion?: string;
  precio_referencial: number;
  unidad_medida?: string;
  imagen_url?: string;
}

export interface AnuncioVentaFavorito {
  id: number;
  precio: number;
  cantidad?: number;
  unidad?: string;
  ubicacion?: string;
  descripcion?: string;
  fecha_creacion?: string;
  producto: {
    nombre: string;
    descripcion?: string;
    imagen_url?: string;
    unidad_medida?: string;
  };
  vendedor?: {
    nombre: string;
    telefono?: string;
  };
}

export interface Favorito {
  id_favorito: number;
  tipo: 'producto' | 'anuncio_venta';
  fecha_agregado?: string;
  producto?: ProductoFavorito;
  anuncio_venta?: AnuncioVentaFavorito;
}

export interface FavoritosListResponse {
  favoritos: Favorito[];
  total?: number;
}

@Injectable({
  providedIn: 'root'
})
export class FavoritosService {

  constructor(private api: ApiService) {}

  /**
   * Agregar producto a favoritos
   */
  agregarProductoFavorito(idProducto: number): Observable<FavoritoResponse> {
    return this.api.post<FavoritoResponse>('favoritos', {
      id_producto: idProducto
    });
  }

  /**
   * Agregar anuncio de venta a favoritos
   */
  agregarAnuncioVentaFavorito(idAnuncioVenta: number): Observable<FavoritoResponse> {
    return this.api.post<FavoritoResponse>('favoritos', {
      id_anuncio_venta: idAnuncioVenta
    });
  }

  /**
   * Obtener lista de favoritos del usuario
   */
  getFavoritos(): Observable<FavoritosListResponse> {
    return this.api.get<FavoritosListResponse>('favoritos');
  }

  /**
   * Quitar de favoritos
   */
  quitarFavorito(idFavorito: number): Observable<FavoritoResponse> {
    return this.api.delete<FavoritoResponse>(`favoritos/${idFavorito}`);
  }

  /**
   * Verificar si un producto está en favoritos
   */
  verificarProductoEnFavoritos(idProducto: number): Observable<boolean> {
    return new Observable(observer => {
      this.getFavoritos().subscribe({
        next: (response) => {
          const esFavorito = response.favoritos.some(
            favorito => favorito.producto?.id === idProducto
          );
          observer.next(esFavorito);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Verificar si un anuncio de venta está en favoritos
   */
  verificarAnuncioVentaEnFavoritos(idAnuncioVenta: number): Observable<boolean> {
    return new Observable(observer => {
      this.getFavoritos().subscribe({
        next: (response) => {
          const esFavorito = response.favoritos.some(
            favorito => favorito.anuncio_venta?.id === idAnuncioVenta
          );
          observer.next(esFavorito);
          observer.complete();
        },
        error: () => {
          observer.next(false);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtener ID de favorito por producto
   */
  getIdFavoritoProducto(idProducto: number): Observable<number | null> {
    return new Observable(observer => {
      this.getFavoritos().subscribe({
        next: (response) => {
          const favorito = response.favoritos.find(
            f => f.producto?.id === idProducto
          );
          observer.next(favorito ? favorito.id_favorito : null);
          observer.complete();
        },
        error: () => {
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  /**
   * Obtener ID de favorito por anuncio de venta
   */
  getIdFavoritoAnuncioVenta(idAnuncioVenta: number): Observable<number | null> {
    return new Observable(observer => {
      this.getFavoritos().subscribe({
        next: (response) => {
          const favorito = response.favoritos.find(
            f => f.anuncio_venta?.id === idAnuncioVenta
          );
          observer.next(favorito ? favorito.id_favorito : null);
          observer.complete();
        },
        error: () => {
          observer.next(null);
          observer.complete();
        }
      });
    });
  }

  /**
   * Toggle favorito para producto (agregar o quitar)
   */
  toggleProductoFavorito(idProducto: number): Observable<{ esFavorito: boolean; mensaje: string }> {
    return new Observable(observer => {
      this.getIdFavoritoProducto(idProducto).subscribe({
        next: (idFavorito) => {
          if (idFavorito) {
            // Ya está en favoritos, quitarlo
            this.quitarFavorito(idFavorito).subscribe({
              next: (response) => {
                observer.next({
                  esFavorito: false,
                  mensaje: response.mensaje || 'Eliminado de favoritos'
                });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          } else {
            // No está en favoritos, agregarlo
            this.agregarProductoFavorito(idProducto).subscribe({
              next: (response) => {
                observer.next({
                  esFavorito: true,
                  mensaje: response.mensaje || 'Agregado a favoritos'
                });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }

  /**
   * Toggle favorito para anuncio de venta (agregar o quitar)
   */
  toggleAnuncioVentaFavorito(idAnuncioVenta: number): Observable<{ esFavorito: boolean; mensaje: string }> {
    return new Observable(observer => {
      this.getIdFavoritoAnuncioVenta(idAnuncioVenta).subscribe({
        next: (idFavorito) => {
          if (idFavorito) {
            // Ya está en favoritos, quitarlo
            this.quitarFavorito(idFavorito).subscribe({
              next: (response) => {
                observer.next({
                  esFavorito: false,
                  mensaje: response.mensaje || 'Eliminado de favoritos'
                });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          } else {
            // No está en favoritos, agregarlo
            this.agregarAnuncioVentaFavorito(idAnuncioVenta).subscribe({
              next: (response) => {
                observer.next({
                  esFavorito: true,
                  mensaje: response.mensaje || 'Agregado a favoritos'
                });
                observer.complete();
              },
              error: (error) => observer.error(error)
            });
          }
        },
        error: (error) => observer.error(error)
      });
    });
  }
}
