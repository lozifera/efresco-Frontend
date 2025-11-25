import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AdminProductosService, CrearProductoData } from '../../core/services/admin-productos.service';
import { NotificationService } from '../../core/services/notification.service';

interface Categoria {
  id: number;
  nombre: string;
}

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrl: './crear-producto.component.scss'
})
export class CrearProductoComponent implements OnInit {
  productoForm: FormGroup;
  categorias: Categoria[] = [];
  isLoading = false;
  isSubmitting = false;

  // Variables para manejo de imagen
  imagePreview: string | null = null;
  imagenArchivo: File | null = null;
  subiendoImagen = false;
  imagenSubida: string | null = null;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private adminProductosService: AdminProductosService,
    private notificationService: NotificationService,
    private router: Router
  ) {
    this.productoForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCategorias();
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      descripcion: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      unidad_medida: ['kg', [Validators.required]],
      precio_referencial: [0, [Validators.required, Validators.min(0.01), Validators.max(999999)]],
      imagen_url: [''],
      categorias: this.fb.array([], [Validators.required])
    });
  }

  get categoriasArray(): FormArray {
    return this.productoForm.get('categorias') as FormArray;
  }

  private loadCategorias(): void {
    // Datos mock de categorías - en producción vendría de la API
    this.categorias = [
      { id: 1, nombre: 'Cereales' },
      { id: 2, nombre: 'Verduras' },
      { id: 3, nombre: 'Tubérculos' },
      { id: 4, nombre: 'Frutas' },
      { id: 5, nombre: 'Legumbres' },
      { id: 6, nombre: 'Hortalizas' },
      { id: 7, nombre: 'Granos' },
      { id: 8, nombre: 'Especias' }
    ];
  }

  onCategoriaChange(categoriaId: number, event: any): void {
    const categoriasArray = this.categoriasArray;

    if (event.target.checked) {
      categoriasArray.push(this.fb.control(categoriaId));
    } else {
      const index = categoriasArray.value.indexOf(categoriaId);
      if (index >= 0) {
        categoriasArray.removeAt(index);
      }
    }
  }

  isCategoriaSelected(categoriaId: number): boolean {
    return this.categoriasArray.value.includes(categoriaId);
  }

  onImageChange(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validar tipo de archivo
      if (!file.type.startsWith('image/')) {
        this.notificationService.show({
          title: 'Archivo inválido',
          message: 'Por favor selecciona un archivo de imagen válido',
          type: 'error'
        });
        return;
      }

      // Validar tamaño (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        this.notificationService.show({
          title: 'Archivo muy grande',
          message: 'El archivo no debe superar los 5MB',
          type: 'error'
        });
        return;
      }

      this.imagenArchivo = file;

      // Preview de la imagen
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  eliminarImagen(): void {
    this.imagenArchivo = null;
    this.imagePreview = null;
    this.imagenSubida = null;
  }

  subirImagen(): void {
    if (!this.imagenArchivo) {
      this.notificationService.show({
        title: 'Sin imagen',
        message: 'Primero selecciona una imagen',
        type: 'warning'
      });
      return;
    }

    this.subiendoImagen = true;

    // Crear un producto temporal para subir la imagen
    // En este caso, usaremos un ID temporal hasta que se cree el producto
    const tempId = Date.now(); // Usar timestamp como ID temporal

    this.adminProductosService.subirImagenProducto(tempId, this.imagenArchivo).subscribe({
      next: (response) => {
        console.log('[Response] Imagen subida:', response);
        this.imagenSubida = response.imagen_url;
        this.subiendoImagen = false;

        this.notificationService.show({
          title: 'Imagen subida',
          message: 'La imagen se subió correctamente',
          type: 'success'
        });
      },
      error: (error) => {
        console.error('[Error] Al subir imagen:', error);
        this.subiendoImagen = false;

        this.notificationService.show({
          title: 'Error al subir imagen',
          message: error.error?.mensaje || 'No se pudo subir la imagen',
          type: 'error'
        });
      }
    });
  }

  onSubmit(): void {
    if (this.productoForm.valid && !this.isSubmitting) {
      this.isSubmitting = true;

      const formData: CrearProductoData = {
        ...this.productoForm.value,
        imagen_url: this.imagenSubida || this.productoForm.value.imagen_url
      };

      this.notificationService.show({
        title: 'Creando producto',
        message: 'Enviando información al servidor...',
        type: 'info'
      });

      this.adminProductosService.crearProducto(formData).subscribe({
        next: (response) => {
          console.log('[Response] Producto creado:', response);
          this.notificationService.show({
            title: 'Producto creado',
            message: response.mensaje || `${response.producto?.nombre || 'El producto'} fue creado exitosamente`,
            type: 'success'
          });

          // Redirigir de vuelta a gestión de productos
          this.router.navigate(['/admin']);
        },
        error: (error) => {
          console.error('[Error] Al crear producto:', error);
          this.notificationService.show({
            title: 'Error al crear producto',
            message: error.error?.mensaje || error.message || 'Hubo un problema al crear el producto',
            type: 'error'
          });
          this.isSubmitting = false;
        },
        complete: () => {
          this.isSubmitting = false;
        }
      });
    } else {
      // Mostrar errores del formulario
      this.markFormGroupTouched();
      this.notificationService.show({
        title: 'Formulario incompleto',
        message: 'Por favor completa todos los campos requeridos',
        type: 'warning'
      });
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.productoForm.controls).forEach(key => {
      const control = this.productoForm.get(key);
      control?.markAsTouched();
    });
  }

  onCancel(): void {
    this.router.navigate(['/admin'], { fragment: 'productos' });
  }

  // Getters para validación del template
  get nombre() { return this.productoForm.get('nombre'); }
  get descripcion() { return this.productoForm.get('descripcion'); }
  get unidad_medida() { return this.productoForm.get('unidad_medida'); }
  get precio_referencial() { return this.productoForm.get('precio_referencial'); }
  get imagen_url() { return this.productoForm.get('imagen_url'); }
}
