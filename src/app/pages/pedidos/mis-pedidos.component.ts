  // --- Verificación de pedido ---
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { PedidosService, Pedido } from '../../core/services/pedidos.service';
import { ChatService } from '../../core/services/chat.service';
import { ReputacionService } from '../../core/services/reputacion.service';
import { NotificationService } from '../../core/services/notification.service';
import { CalificarUsuarioComponent } from '../../components/calificar-usuario/calificar-usuario.component';
import { VerReputacionComponent } from '../../components/ver-reputacion/ver-reputacion.component';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, FormsModule, CalificarUsuarioComponent, VerReputacionComponent],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.scss'
})
export class MisPedidosComponent implements OnInit {
  // --- Verificación de pedido ---
  pedidoAVerificar: Pedido | null = null;
  notaVerificacion: string = '';

  abrirVerificacion(pedido: Pedido): void {
    this.pedidoAVerificar = pedido;
    this.notaVerificacion = '';
    // Ahora se abre el modal propio, no prompt
  }

  verificarPedido(pedido: Pedido, nota: string = ''): void {
    this.pedidosService.verificarPedido(pedido.id, true, nota).subscribe({
      next: () => {
        this.notificationService.show({
          title: 'Pedido verificado',
          message: 'El pedido ha sido marcado como verificado/cumplido.',
          type: 'success'
        });
        this.pedidoAVerificar = null; // Cerrar modal
        this.loadPedidos();
      },
      error: (error) => {
        console.error('Error al verificar pedido:', error);
        this.notificationService.show({
          title: 'Error',
          message: 'No se pudo verificar el pedido',
          type: 'error'
        });
      }
    });
  }
  pedidos: Pedido[] = [];
  isLoading = false;

  // Filtros y paginación
  tipoVista: 'comprador' | 'vendedor' = 'comprador';
  filtroEstado = '';
  currentPage = 1;
  itemsPerPage = 10;
  totalItems = 0;
  totalPages = 0;

  // Estados disponibles
  estados = [
    { value: '', label: 'Todos los estados' },
    { value: 'pendiente', label: 'Pendiente' },
    { value: 'confirmado', label: 'Confirmado' },
    { value: 'en_proceso', label: 'En proceso' },
    { value: 'completado', label: 'Completado' },
    { value: 'cancelado', label: 'Cancelado' }
  ];

  // Estadísticas
  estadisticas = {
    total: 0,
    pendientes: 0,
    completados: 0,
    montoTotal: 0
  };

  // Variables para reputación
  mostrarModalCalificar = false;
  usuarioACalificar: any = null;
  pedidoACalificar: number = 0;
  mostrarReputacionUsuario = false;
  usuarioReputacionId: number = 0;

  constructor(
    private pedidosService: PedidosService,
    private notificationService: NotificationService,
    private chatService: ChatService,
    private reputacionService: ReputacionService,
    public router: Router
  ) {}



  ngOnInit(): void {
    this.loadPedidos();
    this.calculateEstadisticas();
  }

  loadPedidos(): void {
    this.isLoading = true;

    this.pedidosService.getMisPedidos(this.tipoVista, this.currentPage, this.itemsPerPage)
      .subscribe({
        next: (response: { pedidos: Pedido[]; paginacion: { currentPage: number; totalPages: number; totalItems: number; itemsPerPage: number; } }) => {
          this.pedidos = response.pedidos || [];
          this.totalItems = response.paginacion?.totalItems || 0;
          this.totalPages = response.paginacion?.totalPages || 1;
          this.currentPage = response.paginacion?.currentPage || 1;

          // Aplicar filtro de estado si existe
          if (this.filtroEstado) {
            this.pedidos = this.pedidos.filter(p => p.estado === this.filtroEstado);
          }

          this.calculateEstadisticas();
        },
        error: (error) => {
          console.error('Error al cargar pedidos:', error);
          this.notificationService.show({
            title: 'Error',
            message: 'No se pudieron cargar los pedidos',
            type: 'error'
          });
        },
        complete: () => {
          this.isLoading = false;
        }
      });
  }

  onTipoVistaChange(): void {
    this.currentPage = 1;
    this.filtroEstado = '';
    this.loadPedidos();
  }

  onFiltroEstadoChange(): void {
    this.currentPage = 1;
    this.loadPedidos();
  }

  clearFilters(): void {
    this.filtroEstado = '';
    this.currentPage = 1;
    this.loadPedidos();
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.loadPedidos();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadPedidos();
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadPedidos();
    }
  }

  verDetallePedido(pedido: Pedido): void {
    this.router.navigate(['/pedidos', pedido.id]);
  }

  confirmarPedido(pedido: Pedido): void {
    if (confirm(`¿Confirmar el pedido #${pedido.id}?`)) {
      this.pedidosService.actualizarEstadoPedido(pedido.id, 'confirmado')
        .subscribe({
          next: () => {
            this.notificationService.show({
              title: 'Pedido confirmado',
              message: 'El pedido ha sido confirmado exitosamente',
              type: 'success'
            });
            this.loadPedidos();
          },
          error: (error) => {
            console.error('Error al confirmar pedido:', error);
            this.notificationService.show({
              title: 'Error',
              message: 'No se pudo confirmar el pedido',
              type: 'error'
            });
          }
        });
    }
  }

  cancelarPedido(pedido: Pedido): void {
    if (confirm(`¿Está seguro de cancelar el pedido #${pedido.id}?`)) {
      this.pedidosService.cancelarPedido(pedido.id)
        .subscribe({
          next: () => {
            this.notificationService.show({
              title: 'Pedido cancelado',
              message: 'El pedido ha sido cancelado',
              type: 'info'
            });
            this.loadPedidos();
          },
          error: (error) => {
            console.error('Error al cancelar pedido:', error);
            this.notificationService.show({
              title: 'Error',
              message: 'No se pudo cancelar el pedido',
              type: 'error'
            });
          }
        });
    }
  }

  contactarVendedor(pedido: Pedido): void {
    const telefono = pedido.vendedor.telefono;
    const mensaje = `Hola ${pedido.vendedor.nombre}, me pongo en contacto por el pedido #${pedido.id}`;
    const whatsappUrl = `https://wa.me/591${telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(whatsappUrl, '_blank');
  }

  contactarComprador(pedido: Pedido): void {
    // Iniciar chat con el comprador
    const compradorId = pedido.comprador.id_usuario;
    this.router.navigate(['/chat'], {
      queryParams: { destinatario: compradorId }
    });
  }

  iniciarChat(pedido: Pedido): void {
    // Determinar con quién chatear según el tipo de vista
    const destinatarioId = this.tipoVista === 'comprador'
      ? pedido.vendedor.id_usuario
      : pedido.comprador.id_usuario;

    this.router.navigate(['/chat'], {
      queryParams: { destinatario: destinatarioId }
    });
  }

  private calculateEstadisticas(): void {
    this.estadisticas = {
      total: this.pedidos.length,
      pendientes: this.pedidos.filter(p => p.estado === 'pendiente').length,
      completados: this.pedidos.filter(p => p.estado === 'completado').length,
      montoTotal: this.pedidos.reduce((sum, p) => sum + Number(p.monto_total), 0)
    };
  }

  // Métodos auxiliares para el template
  formatearFecha(fecha: string): string {
    return this.pedidosService.formatearFecha(fecha);
  }

  getColorEstado(estado: string): string {
    return this.pedidosService.getColorEstado(estado);
  }

  getDescripcionEstado(estado: string): string {
    return this.pedidosService.getDescripcionEstado(estado);
  }

  getMaxItems(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
  }

  get paginationPages(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    return pages;
  }

  // Validar acciones según tipo de vista y estado
  puedeConfirmar(pedido: Pedido): boolean {
    return this.tipoVista === 'vendedor' && pedido.estado === 'pendiente';
  }

  puedeCompletar(pedido: Pedido): boolean {
    return pedido.estado === 'confirmado' || pedido.estado === 'en_proceso';
  }

  puedeCancelar(pedido: Pedido): boolean {
    return pedido.estado === 'pendiente' || pedido.estado === 'confirmado';
  }

  // Métodos para reputación
  abrirModalCalificar(pedido: Pedido): void {
    // Determinar qué usuario calificar según el tipo de vista
    if (this.tipoVista === 'comprador') {
      // El comprador califica al vendedor
      this.usuarioACalificar = {
        id_usuario: pedido.vendedor.id_usuario,
        nombre: pedido.vendedor.nombre,
        imagen_perfil: 'https://via.placeholder.com/40x40/3b82f6/ffffff?text=' + pedido.vendedor.nombre.charAt(0)
      };
    } else {
      // El vendedor califica al comprador
      this.usuarioACalificar = {
        id_usuario: pedido.comprador.id_usuario,
        nombre: pedido.comprador.nombre,
        imagen_perfil: 'https://via.placeholder.com/40x40/22c55e/ffffff?text=' + pedido.comprador.nombre.charAt(0)
      };
    }

    this.pedidoACalificar = pedido.id;
    this.mostrarModalCalificar = true;
  }

  cerrarModalCalificar(): void {
    this.mostrarModalCalificar = false;
    this.usuarioACalificar = null;
    this.pedidoACalificar = 0;
  }

  onCalificacionEnviada(response: any): void {
    console.log('Calificación enviada exitosamente:', response);
    this.notificationService.show({
      title: '¡Calificación enviada!',
      message: 'Tu calificación ha sido registrada exitosamente',
      type: 'success'
    });

    // Actualizar el estado local del pedido para reflejar que ya fue calificado
    const pedidoIndex = this.pedidos.findIndex(p => p.id === this.pedidoACalificar);
    if (pedidoIndex !== -1) {
      // Agregar una propiedad para indicar que ya fue calificado
      (this.pedidos[pedidoIndex] as any).calificado = true;
    }

    this.cerrarModalCalificar();
  }

  verReputacion(usuarioId: number): void {
    this.usuarioReputacionId = usuarioId;
    this.mostrarReputacionUsuario = true;
  }

  cerrarReputacion(): void {
    this.mostrarReputacionUsuario = false;
    this.usuarioReputacionId = 0;
  }

  puedeCalificar(pedido: Pedido): boolean {
    // Solo se puede calificar si el pedido está completado y aún no se ha calificado
    const yaCalificado = (pedido as any).calificado || false;
    return pedido.estado === 'completado' && !yaCalificado;
  }

  obtenerUsuarioParaCalificar(pedido: Pedido): any {
    return this.tipoVista === 'comprador' ? pedido.vendedor : pedido.comprador;
  }

  obtenerUsuarioParaVerReputacion(pedido: Pedido): any {
    return this.tipoVista === 'comprador' ? pedido.vendedor : pedido.comprador;
  }

  puedeContactar(pedido: Pedido): boolean {
    return ['confirmado', 'en_proceso'].includes(pedido.estado);
  }
}
