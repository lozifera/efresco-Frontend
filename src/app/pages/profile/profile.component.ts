import { PedidosService, Pedido } from '../../core/services/pedidos.service';
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { ImageUtilsService } from '../../core/services/image-utils.service';

interface UserProfile {
  id?: string;
  nombre: string;
  email: string;
  telefono?: string;
  direccion?: string;
  tipoUsuario: 'productor' | 'comprador';
  empresa?: string;
  descripcion?: string;
  foto_perfil_url?: string;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm: FormGroup;
  userProfile: UserProfile | null = null;
  isLoading = false;
  isEditing = false;
  updateMessage = '';

  // Propiedades para foto de perfil
  isUploadingPhoto = false;
  selectedFile: File | null = null;
  photoPreview: string | null = null;
  photoMessage = '';

  pedidosComoComprador: Pedido[] = [];
  pedidosComoVendedor: Pedido[] = [];
  pedidosLoading = false;
  pedidosError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    public router: Router,
    public imageUtils: ImageUtilsService,
    private pedidosService: PedidosService
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


  ngOnInit() {
    this.loadUserProfile();
    this.cargarPedidos();
  }

  cargarPedidos() {
    this.pedidosLoading = true;
    this.pedidosError = '';
    // Como comprador
    this.pedidosService.getMisPedidos('comprador', 1, 10).subscribe({
      next: (resp) => {
        this.pedidosComoComprador = resp.pedidos || [];
        console.log('Pedidos como comprador:', this.pedidosComoComprador);
        // Como vendedor
        this.pedidosService.getMisPedidos('vendedor', 1, 10).subscribe({
          next: (resp2) => {
            this.pedidosComoVendedor = resp2.pedidos || [];
            console.log('Pedidos como vendedor:', this.pedidosComoVendedor);
            this.pedidosLoading = false;
          },
          error: () => {
            this.pedidosError = 'Error al cargar pedidos como vendedor';
            this.pedidosLoading = false;
          }
        });
      },
      error: () => {
        this.pedidosError = 'Error al cargar pedidos como comprador';
        this.pedidosLoading = false;
      }
    });
  }

  loadUserProfile() {
    this.isLoading = true;
    const token = this.authService.getToken();

    console.log('Token encontrado:', !!token);

    if (!token) {
      console.log('No hay token, usando datos demo');
      this.useProfileDemo();
      return;
    }

    console.log('Token encontrado, intentando cargar perfil desde API...');

    this.authService.getUserProfile().subscribe({
      next: (response) => {
        console.log('Respuesta completa del servidor:', response);

        const profile = response.usuario || response;
        console.log('Datos del perfil extraídos:', profile);

        this.userProfile = {
          id: profile.id_usuario?.toString() || profile.id?.toString() || '1',
          nombre: profile.nombre || '',
          email: profile.email || '',
          telefono: profile.telefono || '',
          direccion: profile.direccion || '',
          tipoUsuario: (profile.roles && profile.roles.length > 0 ? profile.roles[0] : 'cliente') as 'productor' | 'comprador',
          empresa: '', // No viene del backend, mantener vacío
          descripcion: '', // No viene del backend, mantener vacío
          foto_perfil_url: profile.foto_perfil_url
        };

        console.log('Perfil mapeado para formulario:', this.userProfile);

        // Actualizar el formulario con los datos
        this.profileForm.patchValue(this.userProfile);

        // Verificar que el formulario se haya actualizado
        console.log('Valores del formulario después de patchValue:', this.profileForm.value);

        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error al cargar perfil:', error);
        this.isLoading = false;

        if (error.status === 401) {
          // Token inválido o expirado - limpiar y usar datos demo
          console.log('Token inválido o expirado - limpiando y usando datos demo');
          this.authService.logout();
          this.useProfileDemo();
        } else {
          // Otros errores - también usar datos demo
          console.log('Error de conexión - usando datos demo');
          this.useProfileDemo();
        }
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

  toggleEdit() {
    this.isEditing = !this.isEditing;
    this.updateMessage = '';
  }

  onSubmit() {
    if (this.profileForm.valid) {
      this.isLoading = true;
      this.updateMessage = '';

      const formData = this.profileForm.value;
      console.log('Intentando actualizar perfil con:', formData);

      const token = this.authService.getToken();

      if (!token) {
        // Sin token, actualizar localmente
        console.log('Sin token - actualizando localmente');
        this.userProfile = { ...this.userProfile, ...formData };
        this.isEditing = false;
        this.isLoading = false;
        this.updateMessage = 'Cambios guardados localmente (sin conexión)';
        setTimeout(() => this.updateMessage = '', 3000);
        return;
      }

      // Intentar actualizar en el backend
      this.authService.updateUserProfile(formData).subscribe({
        next: (response) => {
          console.log('Perfil actualizado exitosamente en backend:', response);

          // Si la respuesta incluye el usuario actualizado, usarlo
          if (response.usuario) {
            this.userProfile = { ...this.userProfile, ...response.usuario };
          } else {
            // Si no viene usuario actualizado, usar los datos del formulario
            this.userProfile = { ...this.userProfile, ...formData };
          }

          this.isEditing = false;
          this.isLoading = false;
          this.updateMessage = response.mensaje || 'Perfil actualizado exitosamente';
          setTimeout(() => this.updateMessage = '', 3000);
        },
        error: (error) => {
          console.error('Error al actualizar perfil en backend:', error);

          // En caso de error, actualizar localmente con los datos del formulario
          this.userProfile = { ...this.userProfile, ...formData };
          this.isEditing = false;
          this.isLoading = false;

          if (error.status === 401) {
            this.updateMessage = 'Sesión expirada - cambios guardados localmente';
            this.authService.logout();
          } else {
            this.updateMessage = 'Sin conexión - cambios guardados localmente';
          }

          setTimeout(() => this.updateMessage = '', 3000);
        }
      });
    }
  }

  // Métodos para manejo de foto de perfil
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.photoMessage = 'Solo se permiten archivos de imagen';
        setTimeout(() => this.photoMessage = '', 3000);
        return;
      }

      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.photoMessage = 'El archivo es muy grande. Máximo 5MB permitido';
        setTimeout(() => this.photoMessage = '', 3000);
        return;
      }

      this.selectedFile = file;

      // Crear preview
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
        console.log('Foto subida exitosamente:', response);

        // Actualizar la URL de la foto en el perfil
        if (this.userProfile && response.foto_perfil_url) {
          this.userProfile.foto_perfil_url = response.foto_perfil_url;
        }

        // Limpiar la selección
        this.selectedFile = null;
        this.photoPreview = null;

        this.isUploadingPhoto = false;
        this.photoMessage = 'Foto actualizada exitosamente';
        setTimeout(() => this.photoMessage = '', 3000);

        // Opcional: recargar el perfil completo
        this.loadUserProfile();
      },
      error: (error) => {
        console.error('Error al subir foto:', error);
        this.isUploadingPhoto = false;

        if (error.status === 401) {
          this.photoMessage = 'Sesión expirada. Inicie sesión nuevamente.';
          this.authService.logout();
        } else if (error.status === 400) {
          this.photoMessage = error.error?.mensaje || 'Formato de imagen no válido';
        } else {
          this.photoMessage = 'Error al subir la foto. Intente nuevamente.';
        }

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
      next: (response) => {
        console.log('Foto eliminada exitosamente:', response);

        // Limpiar la URL de la foto
        if (this.userProfile) {
          this.userProfile.foto_perfil_url = undefined;
        }

        this.isUploadingPhoto = false;
        this.photoMessage = 'Foto eliminada exitosamente';
        setTimeout(() => this.photoMessage = '', 3000);

        // Opcional: recargar el perfil completo
        this.loadUserProfile();
      },
      error: (error) => {
        console.error('Error al eliminar foto:', error);
        this.isUploadingPhoto = false;

        if (error.status === 401) {
          this.photoMessage = 'Sesión expirada. Inicie sesión nuevamente.';
          this.authService.logout();
        } else {
          this.photoMessage = 'Error al eliminar la foto. Intente nuevamente.';
        }

        setTimeout(() => this.photoMessage = '', 3000);
      }
    });
  }

  cancelPhotoSelection() {
    this.selectedFile = null;
    this.photoPreview = null;
    this.photoMessage = '';
  }

  triggerFileInput() {
    const fileInput = document.getElementById('photo-input') as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  // Método para verificar si el usuario es admin
  isAdmin(): boolean {
    return this.authService.isAdmin();
  }

  // Método para obtener URL de imagen segura
  getSafeImageUrl(url: string | undefined): string {
    if (!url) return '';

    // Si es una imagen de eFresco, intentar usar un proxy o fallback
    if (url.includes('efresco-backend.onrender.com/uploads')) {
      // Por ahora, returnamos una imagen placeholder si hay problemas
      return url;
    }

    return url;
  }

  // Método para manejar errores de carga de imagen
  handleImageError(event: any): void {
    console.warn('Image load failed, trying fallback methods');

    const img = event.target;

    // Si no tiene crossOrigin, intentar con crossOrigin
    if (!img.crossOrigin) {
      img.crossOrigin = 'anonymous';
      // Forzar recarga con crossOrigin
      const currentSrc = img.src;
      img.src = '';
      img.src = currentSrc;
      return;
    }

    // Si ya tiene crossOrigin y falla, usar placeholder
    this.setPlaceholderImage(img);
  }

  private setPlaceholderImage(img: HTMLImageElement): void {
    // Imagen placeholder en base64 (avatar genérico)
    const placeholderSvg = `data:image/svg+xml;base64,${btoa(`
      <svg width="100" height="100" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="24" height="24" fill="#F3F4F6"/>
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" fill="#10B981"/>
      </svg>
    `)}`;

    img.src = placeholderSvg;
  }  // Método para obtener URL de imagen de usuario
  getUserImageUrl(): string {
    if (this.userProfile?.foto_perfil_url) {
      // Si la URL es relativa, construir URL completa
      if (this.userProfile.foto_perfil_url.startsWith('/')) {
        return `https://efresco-backend.onrender.com${this.userProfile.foto_perfil_url}`;
      }
      // Si ya es una URL completa, usarla directamente
      return this.userProfile.foto_perfil_url;
    }

    // Fallback a placeholder de usuario
    return '/assets/images/user-placeholder.svg';
  }

  // Método para manejar errores de imagen
  onUserImageError(event: Event): void {
    this.imageUtils.onUserImageError(event);
  }
}
