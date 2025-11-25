import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <div class="register-container">
      <div class="register-card">
        <div class="register-header">
          <h1>Registro en eFresco</h1>
          <p class="subtitle">{{ getSubtitle() }}</p>
        </div>

        <form [formGroup]="registerForm" (ngSubmit)="onSubmit()" class="register-form">

          <!-- Nombre y Apellido -->
          <div class="form-row">
            <div class="form-group">
              <label for="nombre">Nombre *</label>
              <input
                type="text"
                id="nombre"
                formControlName="nombre"
                [class.error]="isFieldInvalid('nombre')"
                placeholder="Tu nombre"
              >
              <div class="error-message" *ngIf="isFieldInvalid('nombre')">
                {{ getFieldError('nombre') }}
              </div>
            </div>

            <div class="form-group">
              <label for="apellido">Apellido</label>
              <input
                type="text"
                id="apellido"
                formControlName="apellido"
                placeholder="Tu apellido"
              >
            </div>
          </div>

          <!-- Email -->
          <div class="form-group">
            <label for="email">Email *</label>
            <input
              type="email"
              id="email"
              formControlName="email"
              [class.error]="isFieldInvalid('email')"
              placeholder="tu@email.com"
            >
            <div class="error-message" *ngIf="isFieldInvalid('email')">
              {{ getFieldError('email') }}
            </div>
          </div>

          <!-- Contraseña -->
          <div class="form-group">
            <label for="password">Contraseña *</label>
            <input
              type="password"
              id="password"
              formControlName="password"
              [class.error]="isFieldInvalid('password')"
              placeholder="Mínimo 6 caracteres"
            >
            <div class="error-message" *ngIf="isFieldInvalid('password')">
              {{ getFieldError('password') }}
            </div>
          </div>

          <!-- Teléfono y Dirección -->
          <div class="form-row">
            <div class="form-group">
              <label for="telefono">Teléfono</label>
              <input
                type="text"
                id="telefono"
                formControlName="telefono"
                placeholder="70123456"
              >
            </div>

            <div class="form-group">
              <label for="direccion">Dirección</label>
              <input
                type="text"
                id="direccion"
                formControlName="direccion"
                placeholder="Ciudad, País"
              >
            </div>
          </div>

          <!-- Tipo de Usuario -->
          <div class="form-group">
            <label for="userType">Tipo de Usuario *</label>
            <div class="user-type-options">
              <label class="radio-option" [class.selected]="selectedUserType === 'productor'">
                <input
                  type="radio"
                  value="productor"
                  formControlName="userType"
                  (change)="onUserTypeChange('productor')"
                >
                <span class="radio-custom"></span>
                <div class="option-content">
                  <strong>🌱 Soy Productor</strong>
                  <p>Vendo mis productos agrícolas</p>
                </div>
              </label>

              <label class="radio-option" [class.selected]="selectedUserType === 'cliente'">
                <input
                  type="radio"
                  value="cliente"
                  formControlName="userType"
                  (change)="onUserTypeChange('cliente')"
                >
                <span class="radio-custom"></span>
                <div class="option-content">
                  <strong>🏢 Soy Comprador</strong>
                  <p>Busco productos para mi empresa</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Términos y condiciones -->
          <div class="form-group">
            <label class="checkbox-option">
              <input type="checkbox" formControlName="acceptTerms">
              <span class="checkbox-custom"></span>
              Acepto los <a href="/terminos" target="_blank">términos y condiciones</a>
            </label>
            <div class="error-message" *ngIf="isFieldInvalid('acceptTerms')">
              Debes aceptar los términos y condiciones
            </div>
          </div>

          <!-- Error general -->
          <div class="error-message" *ngIf="submitError">
            {{ submitError }}
          </div>

          <!-- Botones -->
          <div class="form-actions flex flex-col gap-3">
            <button
              type="submit"
              class="bg-green-500 hover:bg-green-600 disabled:opacity-50 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              [disabled]="registerForm.invalid || isSubmitting"
            >
              <span *ngIf="isSubmitting">⏳</span>
              {{ isSubmitting ? ' Registrando...' : 'Crear Cuenta' }}
            </button>

            <button
              type="button"
              class="border-2 border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 font-semibold py-3 px-6 rounded-lg transition-all duration-200"
              (click)="goBack()"
              [disabled]="isSubmitting"
            >
              ← Cancelar
            </button>
          </div>

          <div class="login-link">
            <p>¿Ya tienes cuenta? <a [routerLink]="['/auth/login']">Iniciar sesión</a></p>
          </div>

        </form>
      </div>
    </div>
  `,
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  selectedUserType: string = 'cliente';
  isSubmitting = false;
  submitError = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.registerForm = this.createForm();
  }

  ngOnInit(): void {
    // Verificar si viene un tipo de usuario por query params
    const userType = this.route.snapshot.queryParams['type'];
    if (userType && ['productor', 'cliente'].includes(userType)) {
      this.selectedUserType = userType;
      this.registerForm.patchValue({ userType });
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      nombre: ['', [Validators.required, Validators.minLength(2)]],
      apellido: [''],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      telefono: [''],
      direccion: [''],
      userType: ['cliente', Validators.required],
      acceptTerms: [false, Validators.requiredTrue]
    });
  }

  onUserTypeChange(type: string): void {
    this.selectedUserType = type;
  }

  getSubtitle(): string {
    if (this.selectedUserType === 'productor') {
      return 'Únete como productor y vende tus productos directamente';
    }
    return 'Regístrate como comprador y encuentra productos frescos';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.registerForm.get(fieldName);
    if (!field || !field.errors) return '';

    if (field.errors['required']) return `${this.getFieldLabel(fieldName)} es requerido`;
    if (field.errors['email']) return 'Email no válido';
    if (field.errors['minlength']) {
      const requiredLength = field.errors['minlength'].requiredLength;
      return `Mínimo ${requiredLength} caracteres`;
    }

    return 'Campo inválido';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'nombre': 'Nombre',
      'email': 'Email',
      'password': 'Contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  async onSubmit(): Promise<void> {
    if (this.registerForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';

    try {
      const formValue = this.registerForm.value;
      const registerPayload = {
        nombre: formValue.nombre,
        apellido: formValue.apellido || '',
        email: formValue.email,
        password: formValue.password,
        telefono: formValue.telefono || '',
        direccion: formValue.direccion || '',
        roles: [formValue.userType === 'productor' ? 'productor' : 'cliente']
      };

      const response = await this.authService.register(registerPayload).toPromise();

      // Registro exitoso
      console.log('Registro exitoso:', response);

      // Redirigir según el tipo de usuario
      if (this.selectedUserType === 'productor') {
        this.router.navigate(['/dashboard/productor']);
      } else {
        this.router.navigate(['/dashboard/comprador']);
      }

    } catch (error: any) {
      console.error('Error en registro:', error);
      this.submitError = error?.error?.mensaje || error?.message || 'Error al registrar usuario';
    } finally {
      this.isSubmitting = false;
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
