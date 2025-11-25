import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PedidosService, CrearPedidoRequest } from '../../core/services/pedidos.service';
import { NotificationService } from '../../core/services/notification.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-crear-pedido',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crear-pedido.component.html',
  styleUrl: './crear-pedido.component.scss'
})
export class CrearPedidoComponent implements OnInit {
  createPedidoForm!: FormGroup;
  isSubmitting = false;
  isLoading = true;

  // Datos para el formulario
  anuncioId: number | null = null;
  anuncio: any = null;
  currentUser: any = null;

  constructor(
    private fb: FormBuilder,
    private pedidosService: PedidosService,
    private notificationService: NotificationService,
    private authService: AuthService,
    public router: Router
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.loadUserInfo();
    this.loadAnuncioFromRoute();
  }

  private initializeForm(): void {
    this.createPedidoForm = this.fb.group({
      cantidad: [1, [Validators.required, Validators.min(1)]],
      precio_unitario: ['', [Validators.required, Validators.min(0.01)]],
      direccion_entrega: ['', [Validators.required, Validators.minLength(10)]],
      fecha_entrega_requerida: ['', [Validators.required]],
      notas: ['', [Validators.maxLength(500)]],
      metodo_pago: ['', [Validators.required]],
      acepta_terminos: [false, [Validators.requiredTrue]]
    });
  }

  private loadUserInfo(): void {
    // Simulamos la carga de información del usuario
    this.currentUser = {
      id: 1,
      nombre: 'Juan Pérez',
      telefono: '+591 70123456',
      empresa: 'Restaurante El Buen Sabor'
    };
  }

  private loadAnuncioFromRoute(): void {
    // En una implementación real, obtendríamos el ID del anuncio de la ruta
    // Por ahora simulamos datos del anuncio
    this.anuncio = {
      id: 1,
      titulo: 'Tomates frescos de primera calidad',
      descripcion: 'Tomates rojos frescos, ideales para restaurantes y hoteles',
      producto: {
        id: 1,
        nombre: 'Tomate',
        categoria: 'Verduras'
      },
      precio_referencial: 15.50,
      disponible: true,
      vendedor: {
        id: 2,
        nombre: 'María González',
        telefono: '+591 71234567',
        ubicacion: 'Valle Alto, Cochabamba'
      }
    };

    // Pre-llenar el precio unitario con el precio referencial
    if (this.anuncio?.precio_referencial) {
      this.createPedidoForm.patchValue({
        precio_unitario: this.anuncio.precio_referencial
      });
    }

    this.isLoading = false;
  }

  get formControls() {
    return this.createPedidoForm.controls;
  }

  get montoTotal(): number {
    const cantidad = this.formControls['cantidad'].value || 0;
    const precioUnitario = this.formControls['precio_unitario'].value || 0;
    return cantidad * precioUnitario;
  }

  get fechaMinimaEntrega(): string {
    const today = new Date();
    const minDate = new Date(today.getTime() + (2 * 24 * 60 * 60 * 1000)); // 2 días mínimo
    return minDate.toISOString().split('T')[0];
  }

  onSubmit(): void {
    if (this.createPedidoForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;
      this.createPedido();
    } else {
      this.markFormGroupTouched();
    }
  }

  private createPedido(): void {
    if (!this.anuncio?.id || !this.currentUser?.id) {
      this.notificationService.error('Error', 'Datos incompletos para crear el pedido');
      this.isSubmitting = false;
      return;
    }

    const pedidoData: CrearPedidoRequest = {
      id_comprador: this.currentUser.id,
      id_vendedor: this.anuncio.vendedor.id,
      id_anuncio: this.anuncio.id,
      tipo_anuncio: 'venta',
      monto_total: this.montoTotal
    };

    this.pedidosService.crearPedido(pedidoData).subscribe({
      next: (response) => {
        this.notificationService.success('¡Éxito!', 'Pedido creado exitosamente');
        this.router.navigate(['/mis-pedidos'], {
          queryParams: { created: response.pedido.id }
        });
      },
      error: (error) => {
        console.error('Error creating pedido:', error);
        this.notificationService.error('Error', 'Error al crear el pedido. Por favor intenta de nuevo.');
        this.isSubmitting = false;
      }
    });
  }  private markFormGroupTouched(): void {
    Object.keys(this.createPedidoForm.controls).forEach(key => {
      const control = this.createPedidoForm.get(key);
      control?.markAsTouched();
    });
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.createPedidoForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.createPedidoForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return 'Este campo es requerido';
      }
      if (field.errors['min']) {
        return `El valor mínimo es ${field.errors['min'].min}`;
      }
      if (field.errors['minlength']) {
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      }
      if (field.errors['maxlength']) {
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      }
    }
    return '';
  }

  onCancel(): void {
    this.router.navigate(['/anuncios/venta']);
  }

  onContactarVendedor(): void {
    if (this.anuncio?.vendedor?.telefono) {
      const mensaje = encodeURIComponent(
        `Hola, estoy interesado en tu anuncio: "${this.anuncio.titulo}". Me gustaría hacer una consulta.`
      );
      const whatsappUrl = `https://wa.me/591${this.anuncio.vendedor.telefono.replace(/\D/g, '')}?text=${mensaje}`;
      window.open(whatsappUrl, '_blank');
    }
  }
}
