import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { ProductosService } from '../../core/services/productos.service';

@Component({
  selector: 'app-test-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-4xl mx-auto p-6">
      <h2 class="text-2xl font-bold mb-6">🧪 Test de Subida de Imágenes - Cloudinary Integration</h2>

      <!-- Estado de Autenticación -->
      <div class="bg-gray-50 rounded-lg p-4 mb-6">
        <h3 class="text-md font-semibold mb-2">🔐 Estado de Autenticación</h3>
        <div class="text-sm">
          <p class="mb-1"><strong>Token presente:</strong>
            <span [class]="hasToken ? 'text-green-600' : 'text-red-600'">
              {{ hasToken ? '✅ Sí' : '❌ No' }}
            </span>
          </p>
          <p *ngIf="!hasToken" class="text-red-600">
            ⚠️ Necesitas <a href="/auth/login" class="underline">iniciar sesión</a> primero
          </p>
        </div>
      </div>

      <!-- Test Foto de Perfil -->
      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h3 class="text-lg font-semibold mb-4">👤 Test Foto de Perfil</h3>

        <div class="space-y-4">
          <input
            type="file"
            accept="image/*"
            (change)="onProfilePhotoSelected($event)"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100">

          <button
            (click)="uploadProfilePhoto()"
            [disabled]="!selectedProfileFile || isUploadingProfile"
            class="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:bg-gray-400">
            <span *ngIf="!isUploadingProfile">📤 Subir Foto de Perfil</span>
            <span *ngIf="isUploadingProfile">⏳ Subiendo...</span>
          </button>

          <div *ngIf="profileMessage" class="p-3 rounded-lg"
               [ngClass]="profileMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'">
            {{ profileMessage }}
          </div>
        </div>
      </div>

      <!-- Test Imagen de Producto -->
      <div class="bg-white rounded-lg shadow p-6">
        <h3 class="text-lg font-semibold mb-4">📦 Test Imagen de Producto</h3>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">ID del Producto:</label>
            <input
              type="number"
              [(ngModel)]="testProductId"
              placeholder="Ej: 1"
              class="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
          </div>

          <input
            type="file"
            accept="image/*"
            (change)="onProductImageSelected($event)"
            class="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-green-50 file:text-green-700 hover:file:bg-green-100">

          <button
            (click)="uploadProductImage()"
            [disabled]="!selectedProductFile || !testProductId || isUploadingProduct"
            class="px-4 py-2 bg-green-600 text-white rounded-lg disabled:bg-gray-400">
            <span *ngIf="!isUploadingProduct">📤 Subir Imagen de Producto</span>
            <span *ngIf="isUploadingProduct">⏳ Subiendo...</span>
          </button>

          <div *ngIf="productMessage" class="p-3 rounded-lg"
               [ngClass]="productMessage.includes('Error') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'">
            {{ productMessage }}
          </div>
        </div>
      </div>

      <!-- Logs de Debug -->
      <div class="bg-gray-100 rounded-lg p-4 mt-6">
        <h4 class="font-semibold mb-2">🔍 Debug Logs - Cloudinary Integration:</h4>
        <div class="text-xs font-mono space-y-1">
          <div>✅ Backend middleware flexible activo</div>
          <div>✅ Frontend enviando campo 'image' para usuarios</div>
          <div>✅ Frontend enviando campo 'imagen' para productos</div>
          <div class="text-green-600">☁️ Cloudinary configurado - Esperando URLs: https://res.cloudinary.com/di97hxomc/</div>
          <div class="text-blue-600">🎯 Imágenes persistirán después de reiniciar servidor</div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f3f4f6;
    }
  `]
})
export class TestUploadComponent {
  // Estado de autenticación
  hasToken = false;

  // Estados para foto de perfil
  selectedProfileFile: File | null = null;
  isUploadingProfile = false;
  profileMessage = '';

  // Estados para imagen de producto
  selectedProductFile: File | null = null;
  testProductId: number = 1;
  isUploadingProduct = false;
  productMessage = '';

  constructor(
    private authService: AuthService,
    private productosService: ProductosService
  ) {
    // Verificar si hay token de autenticación
    this.hasToken = !!localStorage.getItem('token');

    console.log('🔍 TestUploadComponent inicializado');
    console.log('🔐 Token presente:', this.hasToken);
    console.log('☁️  Cloudinary integration activa - esperando URLs con https://res.cloudinary.com/');
  }

  // ========== FOTO DE PERFIL ==========

  onProfilePhotoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedProfileFile = input.files[0];
      this.profileMessage = `✅ Archivo seleccionado: ${this.selectedProfileFile.name} (${(this.selectedProfileFile.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  }

  uploadProfilePhoto() {
    if (!this.selectedProfileFile) return;

    this.isUploadingProfile = true;
    this.profileMessage = '📤 Subiendo foto de perfil...';

    console.log('🔍 DEBUG - Subiendo foto de perfil con campo "image"');
    console.log('📁 Archivo:', this.selectedProfileFile.name, this.selectedProfileFile.size, 'bytes');

    this.authService.uploadProfilePhoto(this.selectedProfileFile).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);

        const imageUrl = response.foto_perfil_url || response.url || 'URL no disponible';
        const isCloudinary = imageUrl.includes('res.cloudinary.com');

        console.log('☁️  URL de imagen:', imageUrl);
        console.log('✅ Es Cloudinary?', isCloudinary);

        this.isUploadingProfile = false;

        if (isCloudinary) {
          this.profileMessage = `🎉 ¡ÉXITO! Imagen subida a Cloudinary: ${imageUrl}`;
          console.log('🎯 CLOUDINARY CONFIRMADO - Imagen persistirá después de reiniciar servidor!');
        } else {
          this.profileMessage = `✅ Imagen subida: ${imageUrl} ${!isCloudinary ? '(⚠️ No es Cloudinary)' : ''}`;
        }

        this.selectedProfileFile = null;
      },
      error: (error: any) => {
        console.error('❌ Error al subir foto de perfil:', error);
        this.isUploadingProfile = false;

        let errorMsg = 'Error desconocido';
        if (error.status === 401) {
          errorMsg = 'Error 401: Token inválido o expirado';
        } else if (error.status === 400) {
          errorMsg = `Error 400: ${error.error?.message || 'Solicitud inválida'}`;
        } else if (error.status === 413) {
          errorMsg = 'Error 413: Archivo muy grande';
        } else if (error.status === 500) {
          errorMsg = 'Error 500: Error interno del servidor';
        }

        this.profileMessage = `❌ Error: ${errorMsg}`;
      }
    });
  }

  // ========== IMAGEN DE PRODUCTO ==========

  onProductImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedProductFile = input.files[0];
      this.productMessage = `✅ Archivo seleccionado: ${this.selectedProductFile.name} (${(this.selectedProductFile.size / 1024 / 1024).toFixed(2)} MB)`;
    }
  }

  uploadProductImage() {
    if (!this.selectedProductFile || !this.testProductId) return;

    this.isUploadingProduct = true;
    this.productMessage = '📤 Subiendo imagen de producto...';

    console.log('🔍 DEBUG - Subiendo imagen de producto con campo "imagen"');
    console.log('📁 Archivo:', this.selectedProductFile.name, this.selectedProductFile.size, 'bytes');
    console.log('🆔 Producto ID:', this.testProductId);

    this.productosService.uploadProductImage(this.testProductId, this.selectedProductFile).subscribe({
      next: (response: any) => {
        console.log('✅ Respuesta del servidor:', response);

        const imageUrl = response.data?.imagen_url || response.imagen_url || response.url || 'URL no disponible';
        const isCloudinary = imageUrl.includes('res.cloudinary.com');

        console.log('☁️  URL de imagen producto:', imageUrl);
        console.log('✅ Es Cloudinary?', isCloudinary);

        this.isUploadingProduct = false;

        if (isCloudinary) {
          this.productMessage = `🎉 ¡ÉXITO! Imagen de producto subida a Cloudinary: ${imageUrl}`;
          console.log('🎯 CLOUDINARY CONFIRMADO - Imagen persistirá después de reiniciar servidor!');
        } else {
          this.productMessage = `✅ Imagen de producto subida: ${imageUrl} ${!isCloudinary ? '(⚠️ No es Cloudinary)' : ''}`;
        }

        this.selectedProductFile = null;
      },
      error: (error: any) => {
        console.error('❌ Error al subir imagen de producto:', error);
        this.isUploadingProduct = false;

        let errorMsg = 'Error desconocido';
        if (error.status === 401) {
          errorMsg = 'Error 401: Token inválido o expirado';
        } else if (error.status === 400) {
          errorMsg = `Error 400: ${error.error?.message || 'Solicitud inválida'}`;
        } else if (error.status === 404) {
          errorMsg = 'Error 404: Producto no encontrado';
        } else if (error.status === 413) {
          errorMsg = 'Error 413: Archivo muy grande';
        } else if (error.status === 500) {
          errorMsg = 'Error 500: Error interno del servidor';
        }

        this.productMessage = `❌ Error: ${errorMsg}`;
      }
    });
  }
}
