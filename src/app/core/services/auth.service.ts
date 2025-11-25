import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { ApiService } from './api.service';

export interface RegisterPayload {
  nombre: string;
  apellido: string;
  email: string;
  password: string;
  telefono?: string;
  direccion?: string;
  roles: string[];
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResponse {
  mensaje: string;
  usuario: {
    id_usuario: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono?: string;
    verificado: boolean;
    roles: string[];
  };
  token: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private tokenKey = 'efresco_token';
  private userKey = 'efresco_user';

  constructor(private api: ApiService) {}

  register(payload: RegisterPayload): Observable<any> {
    // Endpoint according to backend spec
    return this.api.post<any>('usuarios/registro', payload).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
        }
      })
    );
  }

  login(payload: LoginPayload): Observable<LoginResponse> {
    // POST to /usuarios/login endpoint
    return this.api.post<LoginResponse>('usuarios/login', payload).pipe(
      tap(response => {
        if (response && response.token) {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.usuario));
        }
      })
    );
  }

  getUserProfile(): Observable<any> {
    // GET https://efresco-backend.onrender.com/api/usuarios/perfil
    // Headers: Authorization: Bearer <token>
    return this.api.get<any>('usuarios/perfil');
  }

  updateUserProfile(profileData: any): Observable<any> {
    // PUT https://efresco-backend.onrender.com/api/usuarios/perfil
    // Headers: Authorization: Bearer <token>
    // Body: { campos a actualizar }
    return this.api.put<any>('usuarios/perfil', profileData);
  }

  uploadProfilePhoto(file: File): Observable<any> {
    // POST https://efresco-backend.onrender.com/api/usuarios/foto-perfil
    // Headers: Authorization: Bearer <token>, Content-Type: multipart/form-data
    // IMPORTANTE: Campo 'image' para usuarios (inglés)
    const formData = new FormData();
    formData.append('image', file);  // ← Campo 'image' para usuarios
    return this.api.uploadFile('usuarios/foto-perfil', formData);
  }

  deleteProfilePhoto(): Observable<any> {
    // DELETE https://efresco-backend.onrender.com/api/usuarios/foto-perfil
    // Headers: Authorization: Bearer <token>
    return this.api.delete<any>('usuarios/foto-perfil');
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  getCurrentUser(): any {
    const userData = localStorage.getItem(this.userKey);
    return userData ? JSON.parse(userData) : null;
  }

  isAdmin(): boolean {
    const user = this.getCurrentUser();
    return user && user.roles && user.roles.includes('administrador');
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user && user.roles && user.roles.includes(role);
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  // 🚧 MÉTODO TEMPORAL PARA TESTING - SOLO DESARROLLO
  loginAsAdminDemo(): void {
    console.log('🚧 DEMO: Simulando login como administrador');
    const mockAdminToken = 'demo_admin_token_12345';
    const mockAdminUser = {
      id_usuario: 999,
      nombre: 'Admin',
      apellido: 'Demo',
      email: 'admin@demo.com',
      telefono: '123456789',
      verificado: true,
      roles: ['administrador']
    };

    localStorage.setItem(this.tokenKey, mockAdminToken);
    localStorage.setItem(this.userKey, JSON.stringify(mockAdminUser));

    console.log('✅ Usuario admin demo creado:', mockAdminUser);
  }
}
