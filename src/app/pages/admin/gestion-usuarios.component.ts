import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminUsuariosService, Usuario, UsuariosResponse } from '../../core/services/admin-usuarios.service';

@Component({
  selector: 'app-gestion-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-7xl mx-auto p-6">
      <div class="bg-white rounded-lg shadow">
        <!-- Header -->
        <div class="border-b border-gray-200 px-6 py-4">
          <div class="flex justify-between items-center">
            <h2 class="text-2xl font-bold text-gray-900">Gestión de Usuarios</h2>
            <button
              (click)="cargarUsuarios()"
              class="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              Actualizar
            </button>
          </div>

          <!-- Buscador -->
          <div class="flex space-x-4 mt-4">
            <div class="flex-1">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="buscarUsuarios()"
                placeholder="Buscar por nombre o email..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
            </div>
            <button
              (click)="buscarUsuarios()"
              class="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700">
              Buscar
            </button>
            <button
              (click)="limpiarBusqueda()"
              class="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              Limpiar
            </button>
          </div>
        </div>

        <!-- Tabla de Usuarios -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuario</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contacto</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estados</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registro</th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr *ngFor="let usuario of usuarios; trackBy: trackByUserId" class="hover:bg-gray-50">
                <!-- Usuario -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center">
                    <div class="flex-shrink-0 h-10 w-10">
                      <div class="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                        <span class="text-sm font-medium text-gray-600">{{ usuario.nombre.charAt(0) }}{{ (usuario.apellido || '').charAt(0) }}</span>
                      </div>
                    </div>
                    <div class="ml-4">
                      <div class="text-sm font-medium text-gray-900">
                        {{ usuario.nombre }} {{ usuario.apellido || '' }}
                      </div>
                      <div class="text-sm text-gray-500">ID: {{ usuario.id_usuario }}</div>
                    </div>
                  </div>
                </td>

                <!-- Contacto -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="text-sm text-gray-900">{{ usuario.email }}</div>
                  <div class="text-sm text-gray-500">{{ usuario.telefono || 'N/A' }}</div>
                </td>

                <!-- Estados -->
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex flex-col space-y-1">
                    <span [class]="usuario.verificado ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800'">
                      {{ usuario.verificado ? 'Verificado' : 'Pendiente' }}
                    </span>
                    <span [class]="usuario.estado ? 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800' : 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800'">
                      {{ usuario.estado ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </td>

                <!-- Registro -->
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatearFecha(usuario.fecha_registro) }}
                </td>

                <!-- Acciones -->
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <div class="flex space-x-2">
                    <!-- Ver/Editar -->
                    <button
                      (click)="verUsuario(usuario)"
                      class="text-blue-600 hover:text-blue-900 px-3 py-1 text-sm font-medium rounded hover:bg-blue-50 border border-blue-200"
                      title="Ver/Editar usuario">
                      Ver
                    </button>

                    <!-- Verificar/Desverificar -->
                    <button
                      (click)="toggleVerificacion(usuario)"
                      [class]="usuario.verificado ? 'text-yellow-600 hover:text-yellow-900 px-3 py-1 text-sm font-medium rounded hover:bg-yellow-50 border border-yellow-200' : 'text-green-600 hover:text-green-900 px-3 py-1 text-sm font-medium rounded hover:bg-green-50 border border-green-200'"
                      [title]="usuario.verificado ? 'Desverificar usuario' : 'Verificar usuario'">
                      {{ usuario.verificado ? 'Desverificar' : 'Verificar' }}
                    </button>

                    <!-- Activar/Desactivar -->
                    <button
                      (click)="toggleEstado(usuario)"
                      [class]="usuario.estado ? 'text-red-600 hover:text-red-900 px-3 py-1 text-sm font-medium rounded hover:bg-red-50 border border-red-200' : 'text-green-600 hover:text-green-900 px-3 py-1 text-sm font-medium rounded hover:bg-green-50 border border-green-200'"
                      [title]="usuario.estado ? 'Desactivar usuario' : 'Activar usuario'">
                      {{ usuario.estado ? 'Desactivar' : 'Activar' }}
                    </button>

                    <!-- Eliminar -->
                    <button
                      (click)="eliminarUsuario(usuario)"
                      class="text-red-600 hover:text-red-900 px-3 py-1 text-sm font-medium rounded hover:bg-red-50 border border-red-200"
                      title="Eliminar usuario">
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Estado de carga -->
              <tr *ngIf="cargando">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  <div class="flex items-center justify-center">
                    <div class="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    Cargando usuarios...
                  </div>
                </td>
              </tr>

              <!-- Sin resultados -->
              <tr *ngIf="!cargando && usuarios.length === 0">
                <td colspan="5" class="px-6 py-4 text-center text-gray-500">
                  <div class="text-gray-400">
                    <p class="text-lg font-medium">No se encontraron usuarios</p>
                    <p class="text-sm">Intenta ajustar los filtros de búsqueda</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Paginación -->
        <div class="bg-white px-4 py-3 border-t border-gray-200" *ngIf="paginacion">
          <div class="flex items-center justify-between">
            <div class="text-sm text-gray-700">
              Página {{ paginacion.page }} de {{ paginacion.pages }} - Total: {{ paginacion.total }} usuarios
            </div>
            <div class="flex space-x-2">
              <button
                (click)="cambiarPagina(paginacion.page - 1)"
                [disabled]="paginacion.page <= 1"
                class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                ❮ Anterior
              </button>
              <button
                (click)="cambiarPagina(paginacion.page + 1)"
                [disabled]="paginacion.page >= paginacion.pages"
                class="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400">
                Siguiente ❯
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Mensaje de éxito/error -->
      <div *ngIf="mensaje" [class]="mensaje.tipo === 'success' ? 'fixed bottom-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50' : 'fixed bottom-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50'">
        {{ mensaje.texto }}
      </div>
    </div>
  `
})
export class GestionUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];

  // Estados
  cargando = false;
  searchQuery = '';

  // Paginación
  paginacion: any = null;
  paginaActual = 1;
  limitePorPagina = 10;

  // Mensajes
  mensaje: { tipo: 'success' | 'error', texto: string } | null = null;

  constructor(private adminUsuariosService: AdminUsuariosService) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    console.log('[GestionUsuarios] Iniciando carga de usuarios');
    console.log('[Paginacion] Página:', this.paginaActual, 'Límite:', this.limitePorPagina);

    this.cargando = true;
    this.adminUsuariosService.listarUsuarios(this.paginaActual, this.limitePorPagina)
      .subscribe({
        next: (response: UsuariosResponse) => {
          console.log('[Response] Datos recibidos:', response);
          console.log('[Usuarios] Cantidad encontrada:', response.usuarios?.length || 0);
          console.log('[Paginacion] Info:', response.paginacion);

          this.usuarios = response.usuarios || [];
          this.paginacion = response.paginacion;
          this.cargando = false;

          console.log('[Estado] Usuarios cargados en componente:', this.usuarios.length);
        },
        error: (error) => {
          console.error('[Error] Fallo al cargar usuarios:', error);
          console.error('[Error] Status:', error.status);
          console.error('[Error] Mensaje:', error.message);
          console.error('[Error] Detalle:', error.error);

          this.mostrarMensaje(`Error al cargar usuarios: ${error.error?.message || error.message}`, 'error');
          this.cargando = false;
        }
      });
  }

  buscarUsuarios() {
    if (this.searchQuery.trim()) {
      this.cargando = true;
      this.adminUsuariosService.buscarUsuarios(this.searchQuery, this.paginaActual, this.limitePorPagina)
        .subscribe({
          next: (response: UsuariosResponse) => {
            this.usuarios = response.usuarios;
            this.paginacion = response.paginacion;
            this.cargando = false;
          },
          error: (error) => {
            console.error('Error al buscar usuarios:', error);
            this.mostrarMensaje('Error al buscar usuarios', 'error');
            this.cargando = false;
          }
        });
    } else {
      this.cargarUsuarios();
    }
  }

  limpiarBusqueda() {
    this.searchQuery = '';
    this.paginaActual = 1;
    this.cargarUsuarios();
  }

  verUsuario(usuario: Usuario) {
    alert(`📊 Detalles del Usuario:\n\n👤 Nombre: ${usuario.nombre} ${usuario.apellido}\n🆔 ID: ${usuario.id_usuario}\n📧 Email: ${usuario.email}\n📱 Teléfono: ${usuario.telefono || 'N/A'}\n📍 Dirección: ${usuario.direccion || 'N/A'}\n✅ Verificado: ${usuario.verificado ? 'Sí' : 'No'}\n🟢 Activo: ${usuario.estado ? 'Sí' : 'No'}\n📅 Registro: ${this.formatearFecha(usuario.fecha_registro)}\n👥 Roles: ${usuario.roles ? usuario.roles.join(', ') : 'N/A'}`);
  }

  toggleVerificacion(usuario: Usuario) {
    const nuevoEstado = !usuario.verificado;
    const accion = nuevoEstado ? 'verificar' : 'desverificar';

    if (!confirm(`¿Estás seguro de que quieres ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    this.adminUsuariosService.cambiarEstadoUsuario(usuario.id_usuario, { verificado: nuevoEstado })
      .subscribe({
        next: (_response) => {
          usuario.verificado = nuevoEstado;
          this.mostrarMensaje(`Usuario ${nuevoEstado ? 'verificado' : 'desverificado'} exitosamente`, 'success');
        },
        error: (error) => {
          console.error('Error al cambiar verificación:', error);
          this.mostrarMensaje('Error al cambiar verificación', 'error');
        }
      });
  }

  toggleEstado(usuario: Usuario) {
    const nuevoEstado = !usuario.estado;
    const accion = nuevoEstado ? 'activar' : 'desactivar';

    if (!confirm(`¿Estás seguro de que quieres ${accion} a ${usuario.nombre} ${usuario.apellido}?`)) {
      return;
    }

    this.adminUsuariosService.cambiarEstadoUsuario(usuario.id_usuario, { estado: nuevoEstado })
      .subscribe({
        next: (_response) => {
          usuario.estado = nuevoEstado;
          this.mostrarMensaje(`Usuario ${nuevoEstado ? 'activado' : 'desactivado'} exitosamente`, 'success');
        },
        error: (error) => {
          console.error('Error al cambiar estado:', error);
          this.mostrarMensaje('Error al cambiar estado', 'error');
        }
      });
  }

  eliminarUsuario(usuario: Usuario) {
    const confirmacion = confirm(`⚠️ ELIMINAR USUARIO\n\n¿Estás seguro de que quieres eliminar permanentemente a:\n\n👤 ${usuario.nombre} ${usuario.apellido}\n📧 ${usuario.email}\n🆔 ID: ${usuario.id_usuario}\n\n❌ Esta acción NO se puede deshacer.\n\n💡 Alternativa: Considera desactivar el usuario en lugar de eliminarlo.\n\n¿Continuar con la eliminación?`);

    if (confirmacion) {
      this.adminUsuariosService.eliminarUsuario(usuario.id_usuario)
        .subscribe({
          next: (_response) => {
            this.mostrarMensaje('Usuario eliminado exitosamente', 'success');
            this.cargarUsuarios();
          },
          error: (error) => {
            console.error('Error al eliminar usuario:', error);

            if (error.status === 409) {
              const detalles = error.error?.detalles;
              let mensaje = '❌ No se puede eliminar el usuario porque tiene datos relacionados';

              if (detalles) {
                const relaciones = [];
                if (detalles.productos > 0) relaciones.push(`📦 ${detalles.productos} productos`);
                if (detalles.pedidos > 0) relaciones.push(`📋 ${detalles.pedidos} pedidos`);
                if (detalles.chats > 0) relaciones.push(`💬 ${detalles.chats} chats`);

                mensaje += `:\n\n${relaciones.join('\n')}\n\n💡 Recomendación: Desactiva el usuario en lugar de eliminarlo para mantener la integridad de los datos.`;
              }

              alert(mensaje);
            } else {
              this.mostrarMensaje(error.error?.message || 'Error al eliminar usuario', 'error');
            }
          }
        });
    }
  }

  cambiarPagina(nuevaPagina: number) {
    if (nuevaPagina >= 1 && nuevaPagina <= this.paginacion.pages) {
      this.paginaActual = nuevaPagina;

      if (this.searchQuery.trim()) {
        this.buscarUsuarios();
      } else {
        this.cargarUsuarios();
      }
    }
  }

  trackByUserId(index: number, usuario: Usuario): number {
    return usuario.id_usuario;
  }

  formatearFecha(fechaString: string): string {
    const fecha = new Date(fechaString);
    return fecha.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  private mostrarMensaje(texto: string, tipo: 'success' | 'error') {
    this.mensaje = { texto, tipo };
    setTimeout(() => {
      this.mensaje = null;
    }, 5000);
  }
}
