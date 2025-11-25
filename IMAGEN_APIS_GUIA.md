# Guía de Uso - APIs de Imágenes eFresco (Angular)

## 📸 Diferencias Importantes entre Usuarios y Productos

### 🔑 Campos FormData:
- **Usuarios**: `image` (inglés)
- **Productos**: `imagen` (español)

### 📝 Respuestas API:
- **Usuarios**: `foto_perfil_url`
- **Productos**: `imagen_url`

### 🔒 Autenticación:
- **Subir imágenes**: Siempre requiere token Bearer
- **Ver imágenes**: Público (GET productos), requiere auth (GET perfil)

---

## 👤 USUARIOS - Foto de Perfil

### 1. Subir Foto de Perfil
```typescript
// POST /api/usuarios/foto-perfil
const uploadProfilePhoto = async (file: File) => {
  const formData = new FormData();
  formData.append('image', file);  // ← Campo 'image' para usuarios
  
  this.authService.uploadProfilePhoto(file).subscribe({
    next: (response) => {
      console.log('Foto subida:', response);
      // response.foto_perfil_url contiene la nueva URL
      this.userProfile.foto_perfil_url = response.foto_perfil_url;
    },
    error: (error) => console.error('Error:', error)
  });
};
```

### 2. Obtener Perfil con Foto
```typescript
// GET /api/usuarios/perfil
this.authService.getUserProfile().subscribe({
  next: (response) => {
    const profile = response.usuario || response;
    this.userProfile = {
      nombre: profile.nombre,
      email: profile.email,
      foto_perfil_url: profile.foto_perfil_url  // ← URL de la foto
    };
  }
});
```

### 3. Eliminar Foto de Perfil
```typescript
// DELETE /api/usuarios/foto-perfil
this.authService.deleteProfilePhoto().subscribe({
  next: (response) => {
    console.log('Foto eliminada:', response);
    this.userProfile.foto_perfil_url = undefined;
  }
});
```

---

## 📦 PRODUCTOS - Imágenes de Productos

### 1. Subir Imagen de Producto
```typescript
// POST /api/productos/{id}/imagen
const uploadProductImage = (productId: number, file: File) => {
  const formData = new FormData();
  formData.append('imagen', file);  // ← Campo 'imagen' para productos
  
  this.productosService.uploadProductImage(productId, file).subscribe({
    next: (response) => {
      console.log('Imagen subida:', response);
      /*
      Respuesta esperada:
      {
        "success": true,
        "message": "Imagen subida exitosamente",
        "data": {
          "imagen_url": "https://res.cloudinary.com/di97hxomc/image/upload/...",
          "tamaño_mb": "0.25",
          "nombre_archivo": "producto123.jpg",
          "cloudinary_id": "efresco/producto123"
        }
      }
      */
      
      // Actualizar producto con nueva imagen
      this.producto.imagen_url = response.data.imagen_url;
    }
  });
};
```

### 2. Obtener Producto con Imagen
```typescript
// GET /api/productos/{id}
this.productosService.getProducto(productId).subscribe({
  next: (response) => {
    const producto = response.data;
    /*
    Respuesta esperada:
    {
      "success": true,
      "data": {
        "id_producto": 1,
        "nombre": "Tomate Orgánico",
        "precio": 15.50,
        "imagen_url": "https://res.cloudinary.com/di97hxomc/image/upload/...",
        "descripcion": "Tomates frescos...",
        "stock": 100
      }
    }
    */
    
    this.producto = {
      id: producto.id_producto,
      nombre: producto.nombre,
      precio: producto.precio,
      imagen_url: producto.imagen_url  // ← URL de la imagen
    };
  }
});
```

### 3. Eliminar Imagen de Producto
```typescript
// DELETE /api/productos/{id}/imagen
this.productosService.deleteProductImage(productId).subscribe({
  next: (response) => {
    console.log('Imagen eliminada:', response);
    this.producto.imagen_url = undefined;
  }
});
```

---

## 🎯 Ejemplos de Uso en Componentes Angular

### Componente de Perfil (ProfileComponent)
```typescript
export class ProfileComponent {
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      
      // Validaciones
      if (!file.type.startsWith('image/')) {
        this.showError('Solo se permiten archivos de imagen');
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        this.showError('Archivo muy grande. Máximo 5MB');
        return;
      }
      
      this.uploadPhoto(file);
    }
  }
  
  uploadPhoto(file: File) {
    this.isUploading = true;
    
    this.authService.uploadProfilePhoto(file).subscribe({
      next: (response) => {
        this.userProfile.foto_perfil_url = response.foto_perfil_url;
        this.isUploading = false;
        this.showSuccess('Foto actualizada exitosamente');
      },
      error: (error) => {
        this.isUploading = false;
        this.showError('Error al subir la foto');
      }
    });
  }
}
```

### Componente de Gestión de Productos (GestionarProductosComponent)
```typescript
export class GestionarProductosComponent {
  uploadProductImage(productId: number, file: File) {
    this.isUploading = true;
    
    this.productosService.uploadProductImage(productId, file).subscribe({
      next: (response) => {
        // Actualizar producto en la lista
        const producto = this.productos.find(p => p.id === productId);
        if (producto) {
          producto.imagen_url = response.data.imagen_url;
        }
        
        this.isUploading = false;
        this.showSuccess('Imagen subida exitosamente');
      },
      error: (error) => {
        this.isUploading = false;
        
        if (error.status === 401) {
          this.showError('Sesión expirada');
        } else if (error.status === 404) {
          this.showError('Producto no encontrado');
        } else {
          this.showError('Error al subir la imagen');
        }
      }
    });
  }
}
```

---

## 🛡️ Validaciones y Manejo de Errores

### Validaciones Frontend
```typescript
validateImageFile(file: File): boolean {
  // Tipo de archivo
  if (!file.type.startsWith('image/')) {
    this.showError('Solo se permiten archivos de imagen');
    return false;
  }
  
  // Tamaño máximo 5MB
  if (file.size > 5 * 1024 * 1024) {
    this.showError('El archivo es muy grande. Máximo 5MB');
    return false;
  }
  
  return true;
}
```

### Manejo de Errores HTTP
```typescript
handleUploadError(error: any, context: 'usuario' | 'producto') {
  let message = '';
  
  switch (error.status) {
    case 401:
      message = 'Sesión expirada. Inicie sesión nuevamente';
      break;
    case 400:
      message = error.error?.message || 'Formato de imagen no válido';
      break;
    case 404:
      message = context === 'producto' ? 'Producto no encontrado' : 'Usuario no encontrado';
      break;
    case 413:
      message = 'Archivo muy grande. Máximo 5MB permitido';
      break;
    default:
      message = `Error al subir la imagen de ${context}`;
  }
  
  this.showError(message);
}
```

---

## 🎨 HTML Templates

### Subir Foto de Perfil
```html
<!-- Input oculto para seleccionar archivo -->
<input 
  type="file" 
  id="photo-input" 
  accept="image/*" 
  (change)="onFileSelected($event)"
  style="display: none">

<!-- Botón para activar selector -->
<button 
  (click)="triggerFileInput()"
  [disabled]="isUploadingPhoto"
  class="btn btn-primary">
  <span *ngIf="!isUploadingPhoto">Seleccionar Foto</span>
  <span *ngIf="isUploadingPhoto">Subiendo...</span>
</button>

<!-- Vista previa -->
<div *ngIf="photoPreview">
  <img [src]="photoPreview" alt="Preview" class="preview-image">
  <button (click)="uploadPhoto()" [disabled]="isUploadingPhoto">
    Subir Foto
  </button>
  <button (click)="cancelSelection()">
    Cancelar
  </button>
</div>
```

### Gestionar Imágenes de Productos
```html
<div *ngFor="let producto of productos">
  <img 
    [appSafeImage]="producto.imagen_url || ''" 
    [alt]="producto.nombre"
    class="product-image">
    
  <!-- Input para cada producto -->
  <input 
    type="file" 
    [id]="'image-input-' + producto.id" 
    accept="image/*" 
    (change)="onImageFileSelected($event, producto.id)"
    style="display: none">
    
  <!-- Botones de acción -->
  <button (click)="triggerImageInput(producto.id)">
    Cambiar Imagen
  </button>
  
  <button 
    *ngIf="producto.imagen_url" 
    (click)="deleteProductImage(producto)">
    Eliminar Imagen
  </button>
</div>
```

---

## ⚡ Implementación Completa Disponible

✅ **AuthService**: Métodos completos para fotos de perfil
✅ **ProductosService**: Métodos completos para imágenes de productos  
✅ **ProfileComponent**: Funcionalidad completa de gestión de fotos
✅ **GestionarProductosComponent**: Funcionalidad completa de imágenes de productos
✅ **SafeImageDirective**: Manejo robusto de carga de imágenes con fallbacks
✅ **Validaciones**: Frontend y manejo de errores HTTP

Todo está listo para usar con las APIs especificadas! 🚀
