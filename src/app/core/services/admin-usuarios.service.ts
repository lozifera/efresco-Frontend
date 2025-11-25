import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id_usuario: number;
  nombre: string;
  apellido: string | null;
  email: string;
  telefono?: string;
  direccion?: string;
  ubicacion_lat?: number | null;
  ubicacion_lng?: number | null;
  verificado: boolean;
  estado: boolean;
  fecha_registro: string;
  foto_perfil_url?: string | null;
  documento_identidad?: string | null;
  limite_anuncios_diarios?: number;
  anuncios_publicados_hoy?: number;
  ultima_publicacion?: string | null;
  reset_password_token?: string | null;
  reset_password_expires?: string | null;
  Rols?: Array<{ id_rol: number; nombre: string }>;
  roles: string[];
}

export interface UsuariosResponse {
  usuarios: Usuario[];
  paginacion: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface ActualizarUsuarioData {
  nombre?: string;
  apellido?: string;
  email?: string;
  telefono?: string;
  direccion?: string;
  ubicacion_lat?: number;
  ubicacion_lng?: number;
  verificado?: boolean;
  estado?: boolean;
}

export interface CambiarEstadoData {
  verificado?: boolean;
  estado?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminUsuariosService {
  private apiUrl = `${environment.apiUrl}/usuarios`;

  constructor(private http: HttpClient) {}

  /**
   * 🔐 Obtener headers con token de autenticación
   */
  private getAuthHeaders(): HttpHeaders {
    // Usar la misma clave que AuthService
    const token = localStorage.getItem('efresco_token');
    console.log('🔐 AdminUsuariosService - getAuthHeaders');
    console.log('🎫 Token en localStorage:', token ? `${token.substring(0, 20)}...` : 'NO ENCONTRADO');
    console.log('🔍 LocalStorage keys:', Object.keys(localStorage));

    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : '',
      'Content-Type': 'application/json'
    });

    console.log('📋 Headers creados:', headers.get('Authorization') ? 'CON Authorization' : 'SIN Authorization');
    return headers;
  }  /**
   * LISTAR TODOS LOS USUARIOS
   * GET /api/usuarios/
   */
  listarUsuarios(page: number = 1, limit: number = 10): Observable<UsuariosResponse> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString());

    const headers = this.getAuthHeaders();

    console.log('[AdminUsuariosService] Listando usuarios');
    console.log('[URL] Endpoint:', `${this.apiUrl}/`);
    console.log('[Parametros] Página:', page, 'Límite:', limit);
    console.log('[Headers] Claves:', headers.keys());
    console.log('[Token] Estado:', !!localStorage.getItem('efresco_token'));

    return this.http.get<UsuariosResponse>(`${this.apiUrl}/`, {
      params,
      headers
    });
  }

  /**
   * OBTENER USUARIO ESPECÍFICO
   * GET /api/usuarios/admin/{id}
   */
  obtenerUsuario(id: number): Observable<Usuario> {
    const headers = this.getAuthHeaders();
    return this.http.get<Usuario>(`${this.apiUrl}/admin/${id}`, { headers });
  }

  /**
   * ✏️ ACTUALIZAR USUARIO COMPLETO (PUT)
   * PUT /api/usuarios/admin/{id}
   */
  actualizarUsuarioCompleto(id: number, data: ActualizarUsuarioData): Observable<any> {
    return this.http.put(`${this.apiUrl}/admin/${id}`, data);
  }

  /**
   * CAMBIAR ESTADO/VERIFICACIÓN (PUT)
   * PUT /api/usuarios/admin/{id}
   */
  cambiarEstadoUsuario(id: number, data: CambiarEstadoData): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.put(`${this.apiUrl}/admin/${id}`, data, { headers });
  }

  /**
   * ✅ VERIFICAR USUARIO (Método de conveniencia)
   */
  verificarUsuario(id: number): Observable<any> {
    return this.cambiarEstadoUsuario(id, { verificado: true });
  }

  /**
   * 🚫 DESACTIVAR USUARIO (Método de conveniencia)
   */
  desactivarUsuario(id: number): Observable<any> {
    return this.cambiarEstadoUsuario(id, { estado: false });
  }

  /**
   * ✅ ACTIVAR USUARIO (Método de conveniencia)
   */
  activarUsuario(id: number): Observable<any> {
    return this.cambiarEstadoUsuario(id, { estado: true });
  }

  /**
   * 🗑️ ELIMINAR USUARIO
   * DELETE /api/usuarios/admin/{id}
   */
  eliminarUsuario(id: number): Observable<any> {
    const headers = this.getAuthHeaders();
    return this.http.delete(`${this.apiUrl}/admin/${id}`, { headers });
  }

  /**
   * 🔍 BUSCAR USUARIOS POR EMAIL O NOMBRE
   */
  buscarUsuarios(query: string, page: number = 1, limit: number = 10): Observable<UsuariosResponse> {
    const params = new HttpParams()
      .set('search', query)
      .set('page', page.toString())
      .set('limit', limit.toString());

    const headers = this.getAuthHeaders();
    return this.http.get<UsuariosResponse>(`${this.apiUrl}/`, { params, headers });
  }

  /**
   * 📊 OBTENER ESTADÍSTICAS DE USUARIOS
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
