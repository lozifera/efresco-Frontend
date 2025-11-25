
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ImageUtilsService } from '../../core/services/image-utils.service';
import { GestionUsuariosComponent } from './gestion-usuarios.component';
import { AdminStatsService, DashboardStats } from '../../core/services/admin-stats.service';
import { AdminProductosService } from '../../core/services/admin-productos.service';
import { PedidosService } from '../../core/services/pedidos.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ReactiveFormsModule, GestionUsuariosComponent],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.scss'
})
export class AdminComponent implements OnInit {
  // --- Pedidos ---
  isPedidoLoading = false;
  pedidoMessage = '';
  pedidoCreadoId: number | null = null;
  pedidoPagadoId: number | null = null;
    ngOnInit(): void {
      // Cargar datos iniciales
      this.loadUserProfile();
      this.refreshStats();
      this.cargarProductos();
      this.setActiveSection('dashboard');
    }
    // Cargar productos reales desde el backend
    cargarProductos(): void {
      this.isLoadingProductos = true;
      this.adminProductosService.listarProductosAdmin(1, 100).subscribe({
        next: (_resp) => {
          this.productos = _resp.productos.map(p => ({
            ...p,
            imagen: p.imagen_url ? p.imagen_url : 'assets/no-image.png',
            estado: (typeof p.disponible === 'boolean')
              ? (p.disponible ? 'activo' : 'inactivo')
              : 'desconocido'
          }));
          this.isLoadingProductos = false;
        },
        error: (_err) => {
          this.isLoadingProductos = false;
        }
      });
    }

    setActiveSection(section: string): void {
      this.activeSection = section;
    }

    refreshStats(): void {
      this.isLoadingStats = true;
      this.adminStatsService.obtenerEstadisticasDashboard().subscribe({
        next: (stats: DashboardStats) => {
          this.stats = stats;
          this.isLoadingStats = false;
        },
        error: (_err) => {
          this.isLoadingStats = false;
        }
      });
    }

    goToLandingPage(): void {
      this.router.navigate(['/']);
    }

    getCurrentDate(): string {
      return new Date().toLocaleString();
    }

    irAGestionCompleta(): void {
      // Navegar a gestión completa de productos (si aplica)
      this.setActiveSection('productos');
    }

    crearNuevoProducto(): void {
      // Navegar a crear producto (ruta correcta)
      this.router.navigate(['/admin/productos/crear']);
    }

    verProducto(id: number | string): void {
      if (!id) { alert('ID de producto inválido'); return; }
      this.router.navigate(['/admin/productos', id]);
    }

    editarProducto(id: number | string): void {
      if (!id) { alert('ID de producto inválido'); return; }
      this.router.navigate(['/admin/productos/editar', id]);
    }

    toggleProductStatus(id: number | string): void {
      if (!id) { alert('ID de producto inválido'); return; }
      const producto = this.productos.find(p => (p.id || p.id_producto) === id);
      if (!producto) { alert('Producto no encontrado'); return; }
      const nuevoEstado = !producto.disponible;
      const data = { ...producto, disponible: nuevoEstado };
      this.adminProductosService.actualizarProducto(Number(id), data).subscribe({
        next: (resp) => {
          producto.disponible = nuevoEstado;
          producto.estado = nuevoEstado ? 'activo' : 'inactivo';
        }
      });
    }

    deleteProduct(id: number | string): void {
      if (!id) { alert('ID de producto inválido'); return; }
      if (confirm('¿Está seguro de eliminar este producto?')) {
        this.adminProductosService.eliminarProducto(Number(id)).subscribe({
          next: () => {
            this.productos = this.productos.filter(p => (p.id || p.id_producto) !== id);
          }
        });
      }
    }
  currentUser: any;
  // --- Perfil admin ---
  profileForm: FormGroup;
  userProfile: any = null;
  isLoadingProfile = false;
  isEditingProfile = false;
  updateProfileMessage = '';
  // Foto de perfil
  isUploadingPhoto = false;
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  photoMessage = '';
  activeSection = 'dashboard';

  // Estadísticas del dashboard (ahora con datos dinámicos)
  stats: DashboardStats = {
    totalUsuarios: 0,
    productoresActivos: 0,
    ventasMensual: 0,
    pedidosPendientes: 0,
    productosRegistrados: 0,
    ingresosTotales: 0
  };

  isLoadingStats = false;

  // Lista de usuarios para gestión
  usuarios = [
    {
      id: 1,
      nombre: 'Juan',
      apellido: 'Pérez',
      email: 'juan@email.com',
      rol: 'productor',
      verificado: true,
      fechaRegistro: '2024-01-15'
    },
    {
      id: 2,
      nombre: 'María',
      apellido: 'García',
      email: 'maria@email.com',
      rol: 'comprador',
      verificado: true,
      fechaRegistro: '2024-01-20'
    },
    {
      id: 3,
      nombre: 'Carlos',
      apellido: 'López',
      email: 'carlos@email.com',
      rol: 'productor',
      verificado: false,
      fechaRegistro: '2024-02-01'
    }
  ];

  // Lista de productos para gestión (datos reales del backend)
  productos: any[] = [];
  isLoadingProductos = false;

  constructor(
    private authService: AuthService,
    private router: Router,
    private adminStatsService: AdminStatsService,
    private adminProductosService: AdminProductosService,
    private pedidosService: PedidosService,
    private notificationService: NotificationService,
    private fb: FormBuilder,
    public imageUtils: ImageUtilsService
  ) {
    this.profileForm = this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      telefono: [''],
      direccion: [''],
      tipoUsuario: ['productor', Validators.required],
      empresa: [''],
      descripcion: ['']
    });
  }

  // --- PERFIL ADMIN: Lógica igual a /profile ---
  loadUserProfile() {
    this.isLoadingProfile = true;
    const token = this.authService.getToken();
    if (!token) {
      this.useProfileDemo();
      return;
    }
    this.authService.getUserProfile().subscribe({
      next: (response) => {
        const profile = response.usuario || response;
        this.userProfile = {
          id: profile.id_usuario?.toString() || profile.id?.toString() || '1',
          nombre: profile.nombre || '',
          email: profile.email || '',
          telefono: profile.telefono || '',
          direccion: profile.direccion || '',
          tipoUsuario: (profile.roles && profile.roles.length > 0 ? profile.roles[0] : 'cliente'),
          empresa: '',
          descripcion: '',
          foto_perfil_url: profile.foto_perfil_url
        };
        this.profileForm.patchValue(this.userProfile);
        this.currentUser = profile; // Para compatibilidad con el resto del admin
        this.isLoadingProfile = false;
      },
      error: (_err) => {
        this.isLoadingProfile = false;
        this.useProfileDemo();
      }
    });
  }

  private useProfileDemo() {
    this.userProfile = {
      nombre: 'Usuario Demo (Sin conexión)',
      email: 'demo@efresco.com',
      telefono: '+591 70123456',
      direccion: 'La Paz, Bolivia',
      tipoUsuario: 'productor',
      empresa: 'Agricultores Unidos',
      descripcion: 'Datos offline - el backend no está disponible',
      foto_perfil_url: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'
    };
    this.profileForm.patchValue(this.userProfile);
  }

  toggleEditProfile() {
    this.isEditingProfile = !this.isEditingProfile;
    this.updateProfileMessage = '';
  }

  onSubmitProfile() {
    if (this.profileForm.valid) {
      this.isLoadingProfile = true;
      this.updateProfileMessage = '';
      const formData = this.profileForm.value;
      const token = this.authService.getToken();
      if (!token) {
        this.userProfile = { ...this.userProfile, ...formData };
        this.isEditingProfile = false;
        this.isLoadingProfile = false;
        this.updateProfileMessage = 'Cambios guardados localmente (sin conexión)';
        setTimeout(() => this.updateProfileMessage = '', 3000);
        return;
      }
      this.authService.updateUserProfile(formData).subscribe({
        next: (response) => {
          if (response.usuario) {
            this.userProfile = { ...this.userProfile, ...response.usuario };
          } else {
            this.userProfile = { ...this.userProfile, ...formData };
          }
          this.isEditingProfile = false;
          this.isLoadingProfile = false;
          this.updateProfileMessage = response.mensaje || 'Perfil actualizado exitosamente';
          setTimeout(() => this.updateProfileMessage = '', 3000);
        },
        error: (_err) => {
          this.userProfile = { ...this.userProfile, ...formData };
          this.isEditingProfile = false;
          this.isLoadingProfile = false;
          this.updateProfileMessage = 'Error al actualizar perfil';
          setTimeout(() => this.updateProfileMessage = '', 3000);
        }
      });
    }
  }

  // Métodos para manejo de foto de perfil
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      if (!file.type.startsWith('image/')) {
        this.photoMessage = 'Solo se permiten archivos de imagen';
        setTimeout(() => this.photoMessage = '', 3000);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        this.photoMessage = 'El archivo es muy grande. Máximo 5MB permitido';
        setTimeout(() => this.photoMessage = '', 3000);
        return;
      }
      this.selectedFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.photoPreview = e.target?.result as string;
      };
      reader.readAsDataURL(file);
    }
  }

  uploadPhoto() {
    if (!this.selectedFile) {
      this.photoMessage = 'Seleccione una foto primero';
      setTimeout(() => this.photoMessage = '', 3000);
      return;
    }
    const token = this.authService.getToken();
    if (!token) {
      this.photoMessage = 'Debe iniciar sesión para subir una foto';
      setTimeout(() => this.photoMessage = '', 3000);
      return;
    }
    this.isUploadingPhoto = true;
    this.photoMessage = 'Subiendo foto...';
    this.authService.uploadProfilePhoto(this.selectedFile).subscribe({
      next: (response) => {
        if (this.userProfile && response.foto_perfil_url) {
          this.userProfile.foto_perfil_url = response.foto_perfil_url;
        }
        this.selectedFile = null;
        this.photoPreview = null;
        this.isUploadingPhoto = false;
        this.photoMessage = 'Foto actualizada exitosamente';
        setTimeout(() => this.photoMessage = '', 3000);
        this.loadUserProfile();
      },
      error: (_err) => {
        this.isUploadingPhoto = false;
        this.photoMessage = 'Error al subir la foto. Intente nuevamente.';
        setTimeout(() => this.photoMessage = '', 3000);
      }
    });
  }

  deletePhoto() {
    const token = this.authService.getToken();
    if (!token) {
      this.photoMessage = 'Debe iniciar sesión para eliminar la foto';
      setTimeout(() => this.photoMessage = '', 3000);
      return;
    }
    if (!this.userProfile?.foto_perfil_url) {
      this.photoMessage = 'No hay foto para eliminar';
      setTimeout(() => this.photoMessage = '', 3000);
      return;
    }
    if (!confirm('¿Está seguro de que desea eliminar su foto de perfil?')) {
      return;
    }
    this.isUploadingPhoto = true;
    this.photoMessage = 'Eliminando foto...';
    this.authService.deleteProfilePhoto().subscribe({
      next: (_response) => {
        if (this.userProfile) {
          this.userProfile.foto_perfil_url = undefined;
        }
        this.isUploadingPhoto = false;
        this.photoMessage = 'Foto eliminada exitosamente';
        setTimeout(() => this.photoMessage = '', 3000);
        this.loadUserProfile();
      },
      error: (_err) => {
        this.isUploadingPhoto = false;
        this.photoMessage = 'Error al eliminar la foto. Intente nuevamente.';
        setTimeout(() => this.photoMessage = '', 3000);
      }
    });
  }

  cancelPhotoSelection() {
    this.selectedFile = null;
    this.photoPreview = null;
    this.photoMessage = '';
  }

  getUserImageUrl(): string {
    return this.imageUtils.getUserImageUrl(this.userProfile?.foto_perfil_url);
  }

  onUserImageError(event: Event): void {
    this.imageUtils.onUserImageError(event);
  }



  // Cerrar sesión
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Crear pedido para producto activo
  pedirProducto(producto: any): void {
    if (this.isPedidoLoading) return;
    const userData = localStorage.getItem('efresco_user');
    const user = userData ? JSON.parse(userData) : null;
    if (!user || !user.id) {
      this.notificationService.show({ title: 'Error', message: 'Debes iniciar sesión para pedir.', type: 'error' });
      return;
    }
    if (producto.estado !== 'activo') {
      this.notificationService.show({ title: 'No disponible', message: 'El producto no está activo.', type: 'warning' });
      return;
    }
    this.isPedidoLoading = true;
    const pedido = {
      id_comprador: user.id,
      id_vendedor: producto.id_vendedor || producto.productor_id || (producto.productor && producto.productor.id) || (producto.vendedor && producto.vendedor.id) || 1,
      id_anuncio: producto.id || producto.id_anuncio,
      tipo_anuncio: 'venta' as const,
      monto_total: producto.precio
    };
    this.pedidosService.crearPedido(pedido).subscribe({
      next: (res) => {
        this.pedidoMessage = 'Pedido creado exitosamente';
        this.pedidoCreadoId = res.pedido?.id;
        this.notificationService.show({ title: 'Éxito', message: 'Pedido creado exitosamente', type: 'success' });
        this.cargarProductos();
        setTimeout(() => { this.pedidoMessage = ''; this.pedidoCreadoId = null; }, 3000);
      },
      error: (_err) => {
        this.pedidoMessage = 'Error al crear pedido';
        this.notificationService.show({ title: 'Error', message: 'No se pudo crear el pedido', type: 'error' });
        setTimeout(() => { this.pedidoMessage = ''; }, 3000);
      },
      complete: () => { this.isPedidoLoading = false; }
    });
  }

  // Simular pago del pedido
  pagarPedido(pedidoId: number): void {
    if (this.isPedidoLoading) return;
    this.isPedidoLoading = true;
    this.pedidosService.simularPago(pedidoId).subscribe({
      next: (_res: any) => {
        this.pedidoMessage = 'Pago simulado exitosamente';
        this.pedidoPagadoId = pedidoId;
        this.notificationService.show({ title: 'Éxito', message: 'Pago simulado. El anuncio fue marcado como vendido.', type: 'success' });
        this.cargarProductos();
        setTimeout(() => { this.pedidoMessage = ''; this.pedidoPagadoId = null; }, 3000);
      },
      error: (_err: any) => {
        this.pedidoMessage = 'Error al simular pago';
        this.notificationService.show({ title: 'Error', message: 'No se pudo simular el pago', type: 'error' });
        setTimeout(() => { this.pedidoMessage = ''; }, 3000);
      },
      complete: () => { this.isPedidoLoading = false; }
    });
  }
}

